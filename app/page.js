'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import neutralSprite from '@/public/neutral.png';
import petriDish from '@/public/petri.png';
import StatMeter from './components/StatMeter';
import DerivedBadge from './components/DerivedBadge';
import LandingScreen from './components/LandingScreen';
import HabitPanel from './components/HabitPanel';
import HistoryPanel from './components/HistoryPanel';
import SettingsPanel from './components/SettingsPanel';
import HomePanel from './components/HomePanel';
import NavigationBar from './components/NavigationBar';
import {
  STAT_CONFIG,
  NAV_ITEMS,
  DEFAULT_HABIT_FORM,
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

  const scheduleFeedbackClear = useCallback((message) => {
    setFeedback(message);
    if (!message) {
      return;
    }
    setTimeout(() => {
      setFeedback(null);
    }, 2600);
  }, []);

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
    if (activeTab === 'history' && spermId) {
      fetchHistory(spermId);
    }
  }, [activeTab, fetchHistory, spermId]);

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

  const handleHabitChange = (key, value) => {
    setHabitForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleHabitSubmit = async (event) => {
    event.preventDefault();
    if (!spermId) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitHabitCheckInApi({
        spermId,
        date: today,
        habits: habitForm,
      });
      await fetchSpermState(spermId);
      if (activeTab === 'history') {
        await fetchHistory(spermId);
      }
      setHabitForm({ ...DEFAULT_HABIT_FORM });
      scheduleFeedbackClear('Daily care recorded!');
      setActiveTab('home');
    } catch (err) {
      console.error(err);
      const message =
        err?.message && err.message !== 'state-failed'
          ? err.message
          : 'Unable to record those habits. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

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
    setActiveTab('home');
    setFeedback(null);
    setError(null);
    setCreateName('');
    setCreateError(null);
    setLoading(false);
    setHistoryLoading(false);
    setShowLanding(true);
  };

  const renderPanel = () => {
    switch (activeTab) {
      case 'habits':
        return (
          <HabitPanel
            today={today}
            habitForm={habitForm}
            onHabitChange={handleHabitChange}
            onSubmit={handleHabitSubmit}
            submitting={submitting}
          />
        );
      case 'history':
        return <HistoryPanel history={history} loading={historyLoading} />;
      case 'settings':
        return <SettingsPanel loading={loading} onReset={handleReset} />;
      default:
        return <HomePanel latestCheckIn={latestCheckIn} />;
    }
  };

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

  return (
    <main className="flex min-h-screen flex-col gap-6 px-4 pb-24 pt-6 md:px-12 md:pb-28 md:pt-10">
      <header className="flex items-center justify-between rounded-3xl border border-white/70 bg-white/70 px-5 py-4 shadow-sm backdrop-blur">
        <div>
          <h1 className="text-2xl font-bold text-[#3f3d56] md:text-3xl">Sperm Buddy</h1>
          <span className="text-sm font-semibold text-slate-500">
            {sperm?.name ?? 'Loading...'} · Day {sperm?.currentDayIndex ?? 1}
          </span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-pink-100/70 to-sky-100/70 px-4 py-1 text-sm font-semibold text-[#5a4b81]">
          <span role="img" aria-label="sparkles">
            ✨
          </span>
          Caring Mode
        </div>
      </header>

      <section className="flex flex-col items-center gap-4 rounded-3xl border border-indigo-100/80 bg-linear-to-b from-white/95 to-[#f4efff]/90 px-8 py-8 text-center shadow-sm">
        <div className="rounded-full bg-pink-100/50 px-4 py-1 text-sm font-semibold text-pink-500">
          {moodLabel}
        </div>
        <div className="relative flex h-64 w-64 items-center justify-center md:h-72 md:w-72">
          <Image
            src={petriDish}
            alt="Petri dish backdrop"
            width={280}
            height={280}
            className="absolute translate-y-20 h-[280px] w-[280px] object-contain md:bottom-[-22px] md:h-[320px] md:w-[320px]"
            priority
          />
          <div className="relative z-10 flex h-full w-full items-center justify-center animate-float">
            <Image
              src={neutralSprite}
              alt="Sperm buddy"
              width={240}
              height={240}
              priority
              className="h-full w-full object-contain drop-shadow-[0_16px_32px_rgba(63,61,86,0.24)]"
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div className="flex flex-col gap-6">
          <section className="grid grid-cols-3 gap-3">
            <DerivedBadge
              label="Health"
              value={derived?.overallHealthScore ?? '--'}
              accent="#ffafcc"
            />
            <DerivedBadge
              label="Consistency"
              value={derived?.consistencyScore ?? '--'}
              accent="#bde0fe"
            />
            <DerivedBadge
              label="Performance"
              value={derived?.performanceRating ?? '--'}
              accent="#caffbf"
            />
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {STAT_CONFIG.map((stat) => (
              <StatMeter
                key={stat.key}
                label={stat.label}
                abbr={stat.abbr}
                tooltip={stat.tooltip}
                description={stat.description}
                value={Math.round(sperm?.stats?.[stat.key] ?? 0)}
                color={stat.color}
              />
            ))}
          </section>
        </div>

        <section className="flex flex-col rounded-3xl border border-indigo-100/70 bg-white/85 p-6 shadow-sm">
          {loading ? (
            <div className="flex flex-1 items-center justify-center text-sm font-semibold text-slate-500">
              Loading…
            </div>
          ) : (
            renderPanel()
          )}
        </section>
      </section>

      {feedback && !error && (
        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 rounded-full bg-linear-to-r from-[#a1c4fd] to-[#c2e9fb] px-4 py-2 text-sm font-semibold text-[#3f3d56] shadow-[0_12px_30px_rgba(102,126,234,0.35)]">
          {feedback}
        </div>
      )}
      {error && (
        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(255,82,82,0.35)]">
          {error}
        </div>
      )}

      <NavigationBar items={NAV_ITEMS} activeTab={activeTab} onSelect={setActiveTab} />
    </main>
  );
}
