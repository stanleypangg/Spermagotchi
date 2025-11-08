'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import styles from './page.module.css';
import neutralSprite from '@/public/neutral.png';

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

function StatMeter({ label, icon, value, color }) {
  return (
    <div className={styles.statMeter}>
      <div className={styles.statMeterHeader}>
        <span>
          <span className={styles.statIcon}>{icon}</span>
          {label}
        </span>
        <span className={styles.statValue}>{value}</span>
      </div>
      <div className={styles.meterTrack}>
        <div
          className={styles.meterFill}
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function DerivedBadge({ label, value, accent }) {
  return (
    <div className={styles.derivedBadge} style={{ borderColor: accent }}>
      <div className={styles.derivedLabel}>{label}</div>
      <div className={styles.derivedValue}>{value}</div>
    </div>
  );
}

function LandingScreen({ name, onNameChange, onSubmit, creating, error }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <main className={styles.landingContainer}>
      <div className={styles.landingShell}>
        <div className={styles.landingHeader}>
          <span className={styles.landingBadge}>Welcome to Sperm Buddy</span>
          <h1>Hatch Your New Pal</h1>
          <p>
            Start the adventure by naming your sperm buddy. Check in daily to keep them happy,
            healthy, and ready for the big race.
          </p>
        </div>

        <div className={styles.landingHero}>
          <div className={styles.landingHalo} />
          <Image
            src={neutralSprite}
            alt="New sperm buddy illustration"
            width={240}
            height={240}
            priority
            className={styles.landingImage}
          />
        </div>

        <form className={styles.landingForm} onSubmit={handleSubmit}>
          <div className={styles.landingInputGroup}>
            <label htmlFor="sperm-name">Name Your Buddy</label>
            <input
              id="sperm-name"
              type="text"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="e.g. Splash, Bolt, Luna"
              maxLength={24}
              autoComplete="off"
            />
          </div>
          {error && <p className={styles.landingError}>{error}</p>}
          <button className={styles.startButton} type="submit" disabled={creating}>
            {creating ? 'Hatching...' : 'Start the Adventure'}
          </button>
        </form>

        <div className={styles.landingTips}>
          <strong>Pro tip:</strong>
          <span>Daily check-ins boost stats and unlock special milestones.</span>
        </div>
      </div>
    </main>
  );
}

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
    if (activeTab === 'habits') {
      return (
        <form className={styles.habitForm} onSubmit={handleHabitSubmit}>
          <div className={styles.formHeader}>
            <h3>Daily Care</h3>
            <span>{today}</span>
          </div>
          <div className={styles.formGrid}>
            <label className={styles.toggleRow}>
              <span>Supplements</span>
              <input
                type="checkbox"
                checked={habitForm.tookSupplements}
                onChange={(event) =>
                  handleHabitChange('tookSupplements', event.target.checked)
                }
              />
            </label>

            <label className={styles.sliderRow}>
              <div>
                Exercise <span>{habitForm.exerciseMinutes} min</span>
              </div>
              <input
                type="range"
                min="0"
                max="120"
                step="5"
                value={habitForm.exerciseMinutes}
                onChange={(event) =>
                  handleHabitChange('exerciseMinutes', Number(event.target.value))
                }
              />
            </label>

            <label className={styles.sliderRow}>
              <div>
                Hydration <span>{habitForm.drankWaterLiters} L</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={habitForm.drankWaterLiters}
                onChange={(event) =>
                  handleHabitChange('drankWaterLiters', Number(event.target.value))
                }
              />
            </label>

            <label className={styles.sliderRow}>
              <div>
                Sleep <span>{habitForm.sleepHours} hrs</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="0.5"
                value={habitForm.sleepHours}
                onChange={(event) =>
                  handleHabitChange('sleepHours', Number(event.target.value))
                }
              />
            </label>

            <label className={styles.toggleRow}>
              <span>Pineapple Snack</span>
              <input
                type="checkbox"
                checked={habitForm.atePineapple}
                onChange={(event) =>
                  handleHabitChange('atePineapple', event.target.checked)
                }
              />
            </label>

            <label className={styles.toggleRow}>
              <span>Matcha / Tea</span>
              <input
                type="checkbox"
                checked={habitForm.drankMatchaOrTea}
                onChange={(event) =>
                  handleHabitChange('drankMatchaOrTea', event.target.checked)
                }
              />
            </label>

            <label className={styles.sliderRow}>
              <div>
                Alcohol <span>{habitForm.alcoholUnits} drinks</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={habitForm.alcoholUnits}
                onChange={(event) =>
                  handleHabitChange('alcoholUnits', Number(event.target.value))
                }
              />
            </label>

            <label className={styles.sliderRow}>
              <div>
                Cigarettes <span>{habitForm.smokedCigarettes}</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={habitForm.smokedCigarettes}
                onChange={(event) =>
                  handleHabitChange('smokedCigarettes', Number(event.target.value))
                }
              />
            </label>
          </div>
          <button className={styles.submitButton} type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Check-In'}
          </button>
        </form>
      );
    }

    if (activeTab === 'history') {
      return (
        <div className={styles.historyPanel}>
          <div className={styles.panelHeader}>
            <h3>Recent Days</h3>
            {historyLoading && <span className={styles.subtleText}>Loading...</span>}
          </div>
          {history.length === 0 ? (
            <p className={styles.subtleText}>
              No history yet. Log a check-in to see progress here.
            </p>
          ) : (
            <ul className={styles.historyList}>
              {history
                .slice()
                .reverse()
                .map((entry) => (
                  <li key={entry.date} className={styles.historyItem}>
                    <div className={styles.historyDate}>{entry.date}</div>
                    <div className={styles.historyStats}>
                      <span>😊 {entry.stats.happiness}</span>
                      <span>⚡ {entry.stats.vitality}</span>
                      <span>🏊 {entry.stats.motility}</span>
                      <span>🧬 {entry.stats.morphology}</span>
                    </div>
                    <div className={styles.historyDerived}>
                      <span>Health {entry.overallHealthScore}</span>
                      <span>Perf {entry.performanceRating}</span>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      );
    }

    if (activeTab === 'settings') {
      return (
        <div className={styles.settingsPanel}>
          <h3>Buddy Settings</h3>
          <p className={styles.subtleText}>
            Want a fresh start? Hatch a new buddy and begin again.
          </p>
          <button className={styles.resetButton} onClick={handleReset} disabled={loading}>
            {loading ? 'Working...' : 'Hatch New Buddy'}
          </button>
        </div>
      );
    }

    return (
      <div className={styles.homePanel}>
        <h3>Hello, Caretaker!</h3>
        <p className={styles.subtleText}>
          Keep up daily habits to boost stats and prepare your buddy for future adventures.
        </p>
        {latestCheckIn ? (
          <div className={styles.infoCard}>
            <span>Last cared for:</span>
            <strong>{latestCheckIn.date}</strong>
          </div>
        ) : (
          <div className={styles.infoCard}>
            <span>No care yet today.</span>
            <strong>Jump into Habits to get started!</strong>
          </div>
        )}
      </div>
    );
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

  return (
    <main className={styles.app}>
      <header className={styles.header}>
        <div>
          <h1>Sperm Buddy</h1>
          <span className={styles.subtleText}>
            {sperm?.name ?? 'Loading...'} · Day {sperm?.currentDayIndex ?? 1}
          </span>
        </div>
      </header>

      <section className={styles.stage}>
        <div className={styles.moodTag}>
          {derived?.overallHealthScore >= 70
            ? 'Glowing!'
            : derived?.overallHealthScore >= 40
            ? 'Steady'
            : 'Needs Care'}
        </div>
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

      <nav className={styles.navbar}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`${styles.navButton} ${
              activeTab === item.id ? styles.navButtonActive : ''
            }`}
            type="button"
            onClick={() => setActiveTab(item.id)}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
