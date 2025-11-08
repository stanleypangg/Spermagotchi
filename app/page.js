'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import styles from './page.module.css';
import neutralSprite from '@/public/neutral.png';
import StatMeter from './components/StatMeter';
import DerivedBadge from './components/DerivedBadge';
import LandingScreen from './components/LandingScreen';
import HabitPanel from './components/HabitPanel';
import HistoryPanel from './components/HistoryPanel';
import SettingsPanel from './components/SettingsPanel';
import HomePanel from './components/HomePanel';
import NavigationBar from './components/NavigationBar';

const STAT_CONFIG = [
  { key: 'happiness', label: 'Happiness', icon: '😊', color: '#ff99c8' },
  { key: 'vitality', label: 'Vitality', icon: '⚡', color: '#90dbf4' },
  { key: 'motility', label: 'Motility', icon: '🏊', color: '#9bf6ff' },
  { key: 'morphology', label: 'Morphology', icon: '🧬', color: '#caffbf' },
];

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'habits', label: 'Habits', icon: '📝' },
  { id: 'history', label: 'History', icon: '📈' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

const DEFAULT_HABIT_FORM = Object.freeze({
  tookSupplements: false,
  exerciseMinutes: 0,
  drankWaterLiters: 0,
  sleepHours: 8,
  atePineapple: false,
  drankMatchaOrTea: false,
  alcoholUnits: 0,
  smokedCigarettes: 0,
});

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
    const res = await fetch(`/api/sperm/${id}/state`, { cache: 'no-store' });
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('not-found');
      }
      throw new Error('state-failed');
    }
    const data = await res.json();
    setSperm(data.sperm);
    setDerived(data.derived);
    setLatestCheckIn(data.latestCheckIn ?? null);
  }, []);

  const fetchHistory = useCallback(async (id, limit = 14) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(
        `/api/sperm/${id}/history?limit=${encodeURIComponent(limit)}`,
        { cache: 'no-store' },
      );
      if (!res.ok) {
        throw new Error('history-failed');
      }
      const data = await res.json();
      setHistory(data.history ?? []);
    } catch (err) {
      console.error(err);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const createRemoteSperm = useCallback(async (name) => {
    const res = await fetch('/api/sperm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(payload?.error ?? 'Could not hatch buddy.');
    }
    return payload.sperm;
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
        await fetchSpermState(storedId);
        if (!isCancelled) {
          setSpermId(storedId);
          setShowLanding(false);
        }
      } catch (err) {
        console.error(err);
        if (err.message === 'not-found') {
          window.localStorage.removeItem('spermId');
          if (!isCancelled) {
            setSpermId(null);
            setSperm(null);
            setDerived(null);
            setLatestCheckIn(null);
            setHistory([]);
            setShowLanding(true);
            setError(null);
          }
        } else if (!isCancelled) {
          setError('Unable to load buddy. Please refresh.');
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
      await fetchSpermState(newSperm.id);
      setShowLanding(false);
      setCreateName('');
      scheduleFeedbackClear('Buddy hatched! 🌟');
    } catch (err) {
      console.error(err);
      setCreateError(err.message ?? 'Could not hatch buddy. Try again.');
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
      const res = await fetch(`/api/sperm/${spermId}/checkins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, habits: habitForm }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Failed to submit habits.');
      }
      await fetchSpermState(spermId);
      if (activeTab === 'history') {
        await fetchHistory(spermId);
      }
      setHabitForm({ ...DEFAULT_HABIT_FORM });
      scheduleFeedbackClear('Daily care recorded!');
      setActiveTab('home');
    } catch (err) {
      console.error(err);
      setError(err.message);
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
    <main className={styles.app}>
      <header className={styles.header}>
        <div>
          <h1>Sperm Buddy</h1>
          <span className={styles.subtleText}>
            {sperm?.name ?? 'Loading...'} · Day {sperm?.currentDayIndex ?? 1}
          </span>
        </div>
        <div className={styles.badge}>
          <span role="img" aria-label="sparkles">
            ✨
          </span>
          Caring Mode
        </div>
      </header>

      <section className={styles.stage}>
        <div className={styles.moodTag}>{moodLabel}</div>
        <div className={styles.avatarWrapper}>
          <Image
            src={neutralSprite}
            alt="Sperm buddy"
            width={220}
            height={240}
            priority
            className={styles.avatarImage}
          />
        </div>
      </section>

      <section className={styles.dashboard}>
        <div className={styles.metricsColumn}>
          <section className={styles.derivedRow}>
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

          <section className={styles.statsSection}>
            {STAT_CONFIG.map((stat) => (
              <StatMeter
                key={stat.key}
                label={stat.label}
                icon={stat.icon}
                value={sperm?.stats?.[stat.key] ?? 0}
                color={stat.color}
              />
            ))}
          </section>
        </div>

        <section className={styles.panel}>
          {loading ? <div className={styles.loading}>Loading...</div> : renderPanel()}
        </section>
      </section>

      {feedback && !error && <div className={styles.feedback}>{feedback}</div>}
      {error && <div className={styles.errorBanner}>{error}</div>}

      <NavigationBar
        items={NAV_ITEMS}
        activeTab={activeTab}
        onSelect={setActiveTab}
      />
    </main>
  );
}
