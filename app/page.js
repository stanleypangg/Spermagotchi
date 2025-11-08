'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import petriDish from '@/public/petri.png';
import StatMeter from './components/StatMeter';
import DerivedBadge from './components/DerivedBadge';
import LandingScreen from './components/LandingScreen';
import HabitPanel from './components/HabitPanel';
import HistoryPanel from './components/HistoryPanel';
import SettingsPanel from './components/SettingsPanel';
import HomePanel from './components/HomePanel';
import NavigationBar from './components/NavigationBar';
import Modal from './components/Modal';
import {
  STAT_CONFIG,
  NAV_ITEMS,
  DEFAULT_HABIT_FORM,
  WELLNESS_STATES,
} from './data/constants';
import {
  fetchSpermState as fetchSpermStateApi,
  fetchHistoryData,
  createRemoteSperm as createRemoteSpermApi,
  submitHabitCheckIn as submitHabitCheckInApi,
} from './data/api';

export default function Home() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [loading, setLoading] = useState(true);
  const [spermId, setSpermId] = useState(null);
  const [sperm, setSperm] = useState(null);
  const [derived, setDerived] = useState(null);
  const [latestCheckIn, setLatestCheckIn] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [habitForm, setHabitForm] = useState({ ...DEFAULT_HABIT_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [showLanding, setShowLanding] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createError, setCreateError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [debugWellness, setDebugWellness] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  const scheduleFeedbackClear = useCallback((message) => {
    setFeedback(message);
    if (!message) {
      return;
    }
    setTimeout(() => {
      setFeedback(null);
    }, 2600);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setActiveTab('home');
  }, []);

  const handleNavSelect = useCallback(
    (tab) => {
      if (tab === 'home') {
        closeModal();
        return;
      }
      if (tab === 'habits') {
        setActiveTab('habits');
        setActiveModal(null);
        const panel = document.getElementById('habits-panel');
        if (panel) {
          panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      setActiveTab(tab);
      setActiveModal(tab);
    },
    [closeModal],
  );

  const fetchSpermState = useCallback(async (id) => {
    const data = await fetchSpermStateApi(id);
    if (!data) {
      return null;
    }
    setSperm(data.sperm);
    setDerived(data.derived);
    setLatestCheckIn(data.latestCheckIn ?? null);
    return data;
  }, []);

  const fetchHistory = useCallback(async (id, limit = 14) => {
    setHistoryLoading(true);
    try {
      const data = await fetchHistoryData(id, limit);
      setHistory(data.history ?? []);
    } catch (err) {
      console.error(err);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const createRemoteSperm = useCallback(async (name) => {
    return createRemoteSpermApi(name);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function init() {
      if (typeof window === 'undefined') {
        return;
      }
      setLoading(true);
      setError(null);

      const storedId = window.localStorage.getItem('spermId');

      if (!storedId) {
        if (!isCancelled) {
          setSpermId(null);
          setSperm(null);
          setDerived(null);
          setLatestCheckIn(null);
          setHistory([]);
          setShowLanding(true);
          setLoading(false);
        }
        return;
      }

    try {
      const data = await fetchSpermState(storedId);
      if (!data) {
        window.localStorage.removeItem('spermId');
        if (!isCancelled) {
          setSpermId(null);
          setSperm(null);
          setDerived(null);
          setLatestCheckIn(null);
          setHistory([]);
          setShowLanding(true);
        }
        return;
      }
      if (!isCancelled) {
        setSpermId(storedId);
        setShowLanding(false);
      }
    } catch (err) {
      window.localStorage.removeItem('spermId');
      if (!isCancelled) {
        setSpermId(null);
        setSperm(null);
        setDerived(null);
        setLatestCheckIn(null);
        setHistory([]);
        setShowLanding(true);
        if (err?.message && err.message !== 'state-failed') {
          setError(err.message);
        } else {
          setError(null);
        }
      }
    } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      isCancelled = true;
    };
  }, [fetchSpermState]);

  useEffect(() => {
    if ((activeTab === 'history' || activeModal === 'history') && spermId) {
      fetchHistory(spermId);
    }
  }, [activeModal, activeTab, fetchHistory, spermId]);

  const handleLandingNameChange = useCallback(
    (value) => {
      setCreateName(value);
      if (createError) {
        setCreateError(null);
      }
    },
    [createError],
  );

  const handleLandingSubmit = useCallback(async () => {
    const trimmedName = createName.trim();
    if (!trimmedName) {
      setCreateError('Give your buddy a name to begin.');
      return;
    }

    setCreating(true);
    setCreateError(null);
    setError(null);
    setLoading(true);

    try {
      const newSperm = await createRemoteSperm(trimmedName);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('spermId', newSperm.id);
      }
      setSpermId(newSperm.id);
      setHabitForm({ ...DEFAULT_HABIT_FORM });
      setHistory([]);
      setActiveTab('home');
      const data = await fetchSpermState(newSperm.id);
      if (!data) {
        throw new Error('Could not locate the newly hatched buddy.');
      }
      setShowLanding(false);
      setCreateName('');
      scheduleFeedbackClear('Buddy hatched! 🌟');
    } catch (err) {
      console.error(err);
      const message =
        err?.message && err.message !== 'state-failed'
          ? err.message
          : 'Could not hatch buddy. Try again.';
      setCreateError(message);
    } finally {
      setCreating(false);
      setLoading(false);
    }
  }, [
    createName,
    createRemoteSperm,
    fetchSpermState,
    scheduleFeedbackClear,
  ]);

  const syncHabitForm = useCallback(
    async (nextHabits, previousHabits) => {
      if (!spermId) {
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        await submitHabitCheckInApi({
          spermId,
          date: today,
          habits: nextHabits,
        });
        await fetchSpermState(spermId);
        if (activeTab === 'history' || activeModal === 'history') {
          await fetchHistory(spermId);
        }
        scheduleFeedbackClear('Daily care recorded!');
      } catch (err) {
        console.error(err);
        const message =
          err?.message && err.message !== 'state-failed'
            ? err.message
            : 'Unable to record those habits. Please try again.';
        setError(message);
        if (previousHabits) {
          setHabitForm(previousHabits);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [
      activeModal,
      activeTab,
      fetchHistory,
      fetchSpermState,
      scheduleFeedbackClear,
      spermId,
      today,
    ],
  );

  const handleHabitToggle = useCallback(
    (key, value) => {
      setHabitForm((prev) => {
        const next = { ...prev, [key]: value };
        syncHabitForm(next, prev);
        return next;
      });
    },
    [syncHabitForm],
  );

  const handleReset = () => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.removeItem('spermId');
    setSpermId(null);
    setSperm(null);
    setDerived(null);
    setLatestCheckIn(null);
    setHistory([]);
    setHabitForm({ ...DEFAULT_HABIT_FORM });
    closeModal();
    setFeedback(null);
    setError(null);
    setCreateName('');
    setCreateError(null);
    setLoading(false);
    setHistoryLoading(false);
    setShowLanding(true);
  };

  const renderPanel = () => <HomePanel latestCheckIn={latestCheckIn} />;

  if (showLanding) {
    return (
      <LandingScreen
        name={createName}
        onNameChange={handleLandingNameChange}
        onSubmit={handleLandingSubmit}
        creating={creating}
        error={createError}
      />
    );
  }

  const moodLabel =
    derived?.overallHealthScore >= 70
      ? 'Glowing!'
      : derived?.overallHealthScore >= 40
      ? 'Steady'
      : 'Needs Care';

  const safeStat = (value) => (typeof value === 'number' ? value : 0);
  const combinedScore =
    safeStat(sperm?.stats?.motility) * 0.35 +
    safeStat(sperm?.stats?.linearity) * 0.3 +
    safeStat(sperm?.stats?.flow) * 0.2 +
    safeStat(sperm?.stats?.signals) * 0.15;
  const effectiveScore =
    debugWellness !== null ? debugWellness : combinedScore;

  const wellnessState = WELLNESS_STATES.reduce((current, candidate) => {
    if (effectiveScore >= candidate.threshold) {
      return candidate;
    }
    return current;
  }, WELLNESS_STATES[0]);

  const topStats = [
    { id: 'points', label: 'Points', value: derived?.overallHealthScore ?? '--' },
    { id: 'energy', label: 'Energy', value: Math.round(effectiveScore) ?? '--' },
    { id: 'settings', label: 'Settings', action: () => handleNavSelect('settings') },
    { id: 'streak', label: 'Streak', value: latestCheckIn?.streak ?? '0' },
  ];

  return (
    <>
      <main className="relative flex min-h-screen flex-col bg-white pb-32">
        <header className="flex items-center justify-between px-6 pt-6">
          {topStats.map((item) => (
            <div key={item.id} className="flex flex-col items-center text-sm font-semibold text-slate-600">
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.label}</span>
              {item.action ? (
                <button
                  type="button"
                  onClick={item.action}
                  className="mt-1 rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold text-slate-600"
                >
                  Open
                </button>
              ) : (
                <span className="mt-1 text-lg text-slate-700">{item.value}</span>
              )}
            </div>
          ))}
        </header>

        <section className="flex flex-1 flex-col items-center justify-center px-6">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            {sperm?.name ?? 'Buddy'} · Day {sperm?.currentDayIndex ?? 1}
          </div>
          <div className="rounded-full bg-pink-100/60 px-4 py-1 text-xs font-semibold text-pink-500">
            {moodLabel}
          </div>
          <div className="relative mt-6 flex h-56 w-56 items-center justify-center">
            <Image
              src={petriDish}
              alt="Petri dish backdrop"
              width={240}
              height={240}
              className="absolute h-[220px] w-[220px] translate-y-12 object-contain opacity-90"
              priority
            />
            <div className="relative z-10 flex h-full w-full items-center justify-center animate-float">
              <Image
                src={wellnessState.asset}
                alt={wellnessState.alt}
                width={220}
                height={220}
                priority
                className="h-full w-full object-contain drop-shadow-[0_16px_32px_rgba(63,61,86,0.24)]"
              />
            </div>
          </div>
          <div className="mt-4 text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-slate-500">
            Wellness {Math.round(effectiveScore)}
          </div>
        </section>

        <section className="px-6">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            <span>Daily Check-In</span>
            <span>{today}</span>
          </div>
          <div className="max-h-48 overflow-y-auto rounded-3xl border border-slate-200 bg-white/90 px-4 py-3">
            <HabitPanel today={today} habitForm={habitForm} onToggle={handleHabitToggle} submitting={submitting} />
          </div>
        </section>
      </main>

      {feedback && !error && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 rounded-full bg-linear-to-r from-[#a1c4fd] to-[#c2e9fb] px-4 py-2 text-sm font-semibold text-[#3f3d56] shadow-[0_12px_30px_rgba(102,126,234,0.35)]">
          {feedback}
        </div>
      )}
      {error && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(255,82,82,0.35)]">
          {error}
        </div>
      )}

      <NavigationBar items={NAV_ITEMS} activeTab={activeTab} onSelect={handleNavSelect} />

      <Modal title="Progress History" open={activeModal === 'history'} onClose={closeModal}>
        <HistoryPanel history={history} loading={historyLoading} />
      </Modal>

      <Modal title="Settings & Debug" open={activeModal === 'settings'} onClose={closeModal}>
        <SettingsPanel loading={loading} onReset={handleReset} />
      </Modal>
    </>
  );
}
