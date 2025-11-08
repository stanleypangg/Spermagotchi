'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import petriDish from '@/public/petri.png';
import LandingScreen from './components/LandingScreen';
import HabitPanel from './components/HabitPanel';
import HistoryPanel from './components/HistoryPanel';
import SettingsPanel from './components/SettingsPanel';
import NavigationBar from './components/NavigationBar';
import Modal from './components/Modal';
import {
  NAV_ITEMS,
  DEFAULT_HABIT_FORM,
  WELLNESS_STATES,
  HABIT_IMAGE_OVERRIDES,
  SHOP_CLOTHING_ITEMS,
} from './data/constants';
import {
  fetchSpermState as fetchSpermStateApi,
  fetchHistoryData,
  createRemoteSperm as createRemoteSpermApi,
  submitHabitCheckIn as submitHabitCheckInApi,
} from './data/api';

const WARDROBE_STATE_KEY = 'spermagotchi-wardrobe';
const COIN_ICON_URL = 'https://cdn-icons-png.flaticon.com/512/7672/7672104.png';
const TODO_PANEL_WIDTH = 360;
const TODO_PANEL_GAP = 24;

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
  const [buddyOverride, setBuddyOverride] = useState(null);
  const [coins, setCoins] = useState(null);
  const [ownedClothing, setOwnedClothing] = useState([]);
  const [equippedClothing, setEquippedClothing] = useState(null);
  const [previewClothing, setPreviewClothing] = useState(null);
  const [purchaseCandidate, setPurchaseCandidate] = useState(null);
  const [showTodos, setShowTodos] = useState(false);

  const renderCoinValue = useCallback(
    (value, sizeClass = 'h-4 w-4') => (
      <span className="inline-flex items-center gap-1 align-middle">
        <img src={COIN_ICON_URL} alt="Coin icon" className={sizeClass} />
        <span>{value}</span>
      </span>
    ),
    [],
  );

  const selectOverrideFromHabits = useCallback((habits) => {
    if (!habits) {
      return null;
    }
    const keys = Object.keys(habits);
    for (let index = keys.length - 1; index >= 0; index -= 1) {
      const habitKey = keys[index];
      if (habits[habitKey] && HABIT_IMAGE_OVERRIDES[habitKey]) {
        const override = HABIT_IMAGE_OVERRIDES[habitKey];
        return { key: habitKey, ...override };
      }
    }
    return null;
  }, []);

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
        setShowTodos(false);
        return;
      }
      if (tab === 'shop') {
        setShowTodos(false);
        setActiveTab('shop');
        setActiveModal(null);
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
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const stored = window.localStorage.getItem(WARDROBE_STATE_KEY);
      if (!stored) {
        return;
      }
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed?.ownedIds)) {
        setOwnedClothing(
          parsed.ownedIds.filter((value) => typeof value === 'string'),
        );
      }
      if (typeof parsed?.equippedId === 'string') {
        setEquippedClothing(parsed.equippedId);
      } else if (parsed?.equippedId === null) {
        setEquippedClothing(null);
      }
      if (typeof parsed?.coins === 'number' && Number.isFinite(parsed.coins)) {
        setCoins(parsed.coins);
      }
    } catch (storageError) {
      console.error('Failed to load wardrobe state', storageError);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const payload = JSON.stringify({
        coins,
        ownedIds: ownedClothing,
        equippedId: equippedClothing,
      });
      window.localStorage.setItem(WARDROBE_STATE_KEY, payload);
    } catch (storageError) {
      console.error('Failed to persist wardrobe state', storageError);
    }
  }, [coins, ownedClothing, equippedClothing]);

  useEffect(() => {
    if (ownedClothing.includes('sixty-seven') || equippedClothing === 'sixty-seven') {
      setOwnedClothing((prev) =>
        prev.map((id) => (id === 'sixty-seven' ? '67' : id)),
      );
      if (equippedClothing === 'sixty-seven') {
        setEquippedClothing('67');
      }
      if (previewClothing === 'sixty-seven') {
        setPreviewClothing('67');
      }
    }
  }, [ownedClothing, equippedClothing, previewClothing]);

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
    if (coins === null && typeof derived?.overallHealthScore === 'number') {
      setCoins(Math.max(0, Math.round(derived.overallHealthScore ?? 0)));
    }
  }, [coins, derived]);

  useEffect(() => {
    if ((activeTab === 'history' || activeModal === 'history') && spermId) {
      fetchHistory(spermId);
    }
  }, [activeModal, activeTab, fetchHistory, spermId]);

  useEffect(() => {
    if (activeTab !== 'shop' && previewClothing) {
      setPreviewClothing(null);
    }
  }, [activeTab, previewClothing]);

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
      setBuddyOverride(null);
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
      } catch (err) {
        console.error(err);
        const message =
          err?.message && err.message !== 'state-failed'
            ? err.message
            : 'Unable to record those habits. Please try again.';
        setError(message);
        if (previousHabits) {
          setHabitForm(previousHabits);
          setBuddyOverride(selectOverrideFromHabits(previousHabits));
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
      selectOverrideFromHabits,
    ],
  );

  const handleHabitToggle = useCallback(
    (key, value) => {
      const nextHabits = { ...habitForm, [key]: value };
      syncHabitForm(nextHabits, habitForm);
      setHabitForm(nextHabits);
      const override = HABIT_IMAGE_OVERRIDES[key];
      if (value && override) {
        setBuddyOverride({ key, ...override });
      } else if (!value && buddyOverride?.key === key) {
        setBuddyOverride(selectOverrideFromHabits(nextHabits));
      }
    },
    [habitForm, buddyOverride, selectOverrideFromHabits, syncHabitForm],
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
    setBuddyOverride(null);
    closeModal();
    setFeedback(null);
    setError(null);
    setCreateName('');
    setCreateError(null);
    setLoading(false);
    setHistoryLoading(false);
    setShowLanding(true);
  };

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

  const pointsValue = Number.isFinite(derived?.overallHealthScore)
    ? Math.round(derived.overallHealthScore)
    : '--';
  const energyValue = Number.isFinite(effectiveScore) ? Math.round(effectiveScore) : '--';
  const streakValue = Number.isFinite(sperm?.history?.length) ? sperm.history.length : '--';

  const topStats = [
    { id: 'points', label: 'Points', value: pointsValue },
    { id: 'energy', label: 'Energy', value: energyValue },
    { id: 'settings', label: 'Settings', action: () => handleNavSelect('settings') },
    { id: 'streak', label: 'Streak', value: streakValue },
  ];

  const activeBuddyState = buddyOverride ?? wellnessState;
  const coinsDisplay =
    coins !== null
      ? coins
      : Number.isFinite(pointsValue)
      ? Number(pointsValue)
      : 0;
  const equippedOutfitItem =
    SHOP_CLOTHING_ITEMS.find((item) => item.id === equippedClothing) ?? null;
  const previewOutfitItem = previewClothing
    ? SHOP_CLOTHING_ITEMS.find((item) => item.id === previewClothing) ?? null
    : null;

  const handleSelectOutfit = useCallback(
    (item) => {
      setError(null);
      setPreviewClothing(item.id);
      if (ownedClothing.includes(item.id)) {
        setEquippedClothing(item.id);
      }
    },
    [ownedClothing],
  );

  const handleEquipOwned = useCallback(
    (item) => {
      setError(null);
      setEquippedClothing(item.id);
      setPreviewClothing(item.id);
      scheduleFeedbackClear(`${item.name} equipped!`);
    },
    [scheduleFeedbackClear],
  );

  const handleOpenPurchaseModal = useCallback((item) => {
    setPreviewClothing(item.id);
    setPurchaseCandidate(item);
    setError(null);
  }, []);

  const handleClosePurchaseModal = useCallback(() => {
    setPurchaseCandidate(null);
  }, []);

  const handleConfirmPurchase = useCallback(() => {
    if (!purchaseCandidate) {
      return;
    }
    const { id, price, name } = purchaseCandidate;
    const currentCoins = coins !== null ? coins : coinsDisplay;
    if (currentCoins < price) {
      setError(`Need ${Math.max(0, price - currentCoins)} more coins to buy ${name}.`);
      return;
    }

    setCoins((prevCoins) => {
      const baseline = prevCoins ?? coinsDisplay;
      const updated = baseline - price;
      return updated < 0 ? 0 : updated;
    });

    setOwnedClothing((prev) => {
      if (prev.includes(id)) {
        return prev;
      }
      return [...prev, id];
    });

    setEquippedClothing(id);
    setPreviewClothing(id);
    setPurchaseCandidate(null);
    setError(null);
    scheduleFeedbackClear(`Fresh drip! ${name} unlocked.`);
  }, [coins, coinsDisplay, purchaseCandidate, scheduleFeedbackClear]);

  const homeDisplayOutfit = equippedOutfitItem;

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

  const renderHomeView = () => (
    <main className="relative flex min-h-screen flex-col bg-white pb-24">
      <header className="flex flex-wrap items-center justify-between gap-4 px-6 pt-6">
        <button
          type="button"
          onClick={() => setShowTodos((value) => !value)}
          aria-pressed={showTodos}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
            showTodos
              ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
              : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600'
          }`}
        >
          <span className="text-lg">🗒️</span>
          <span>{showTodos ? 'Hide Todos' : 'Daily Todos'}</span>
        </button>
        <div className="flex flex-1 flex-wrap items-center justify-center gap-6">
          {topStats.map((item) => (
            <div
              key={item.id}
              className="flex min-w-[120px] flex-col items-center text-sm font-semibold text-slate-600"
            >
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
        </div>
      </header>

      <div className="relative flex flex-1 items-stretch overflow-hidden px-6 pb-12 pt-8">
        <aside
          className="absolute inset-y-0 left-0 z-10 flex h-full flex-col rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-lg transition-all duration-500 ease-out"
          style={{
            width: TODO_PANEL_WIDTH,
            transform: `translateX(${showTodos ? 0 : -(TODO_PANEL_WIDTH + TODO_PANEL_GAP)}px)`,
            opacity: showTodos ? 1 : 0,
            pointerEvents: showTodos ? 'auto' : 'none',
          }}
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Do Your Quick Daily Check-ins
            </p>
            <p className="text-xs text-slate-400">
              Toggle today’s habits to keep your swimmer in peak form.
          </p>
        </div>
          <div className="mt-4 flex-1 overflow-y-auto pr-1">
            <HabitPanel habitForm={habitForm} onToggle={handleHabitToggle} submitting={submitting} />
          </div>
        </aside>

        <section
          className="relative z-0 flex w-full flex-col items-center justify-center transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(${showTodos ? TODO_PANEL_WIDTH + TODO_PANEL_GAP : 0}px)`,
          }}
        >
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            {sperm?.name ?? 'Buddy'} · Day {sperm?.currentDayIndex ?? 1}
          </div>
          <div className="rounded-full bg-pink-100/60 px-4 py-1 text-xs font-semibold text-pink-500">
            {buddyOverride ? buddyOverride.label : moodLabel}
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
            <div className="relative z-10 flex h-full w-full items-center justify-center">
              {homeDisplayOutfit ? (
                <Image
                  src={homeDisplayOutfit.imagePath}
                  alt={homeDisplayOutfit.name}
                  width={220}
                  height={220}
                  priority
                  className="h-full w-full animate-float object-contain drop-shadow-[0_16px_32px_rgba(63,61,86,0.24)]"
                />
              ) : (
                <Image
                  src={activeBuddyState.asset}
                  alt={activeBuddyState.alt}
                  width={220}
                  height={220}
                  priority
                  className="h-full w-full animate-float object-contain drop-shadow-[0_16px_32px_rgba(63,61,86,0.24)]"
                />
              )}
            </div>
          </div>
          <div className="mt-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
            {homeDisplayOutfit ? homeDisplayOutfit.name : activeBuddyState.label ?? activeBuddyState.alt}
          </div>
          <div className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-slate-500">
            Wellness {Number.isFinite(effectiveScore) ? Math.round(effectiveScore) : '--'}
          </div>
          <div className="mt-4 flex w-full max-w-sm flex-col items-stretch gap-2 text-left">
            <label className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
              Debug Wellness
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={debugWellness ?? Math.round(combinedScore)}
              onChange={(event) => setDebugWellness(Number(event.target.value))}
              className="accent-[#8f54ff]"
            />
            <button
              type="button"
              onClick={() => setDebugWellness(null)}
              className="self-end text-xs font-semibold text-indigo-500 underline"
            >
              reset
            </button>
          </div>
        </section>
      </div>
    </main>
  );

  const renderShopView = () => {
    const selectedId = previewClothing ?? equippedClothing ?? null;
    const selectedItem =
      SHOP_CLOTHING_ITEMS.find((item) => item.id === selectedId) ?? null;
    const overlayItem = previewOutfitItem ?? selectedItem ?? null;
    const selectedOwned = selectedItem ? ownedClothing.includes(selectedItem.id) : false;
    const selectedEquipped = selectedItem ? equippedClothing === selectedItem.id : false;

  return (
      <main className="grid h-screen grid-rows-1 gap-6 overflow-hidden bg-white px-4 py-8 md:grid-cols-[320px_1fr] md:px-12">
        <aside className="flex flex-col gap-4 overflow-hidden">
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  <img src={COIN_ICON_URL} alt="Coin icon" className="h-4 w-4" />
                  <span>Coins</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-800">
                  {renderCoinValue(coinsDisplay, 'h-6 w-6')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleNavSelect('home')}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              >
                Back
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-400">Coins mirror your Points from the main loop.</p>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-hidden rounded-3xl border border-slate-200 bg-white px-4 py-5 shadow-sm">
            <header className="px-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Wardrobe Shop
              </p>
              <p className="text-[0.7rem] text-slate-400">Tap to preview · Buy to own · Equip instantly</p>
            </header>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
              {SHOP_CLOTHING_ITEMS.map((item) => {
                const isOwned = ownedClothing.includes(item.id);
                const isEquipped = equippedClothing === item.id;
                const isSelected = selectedId === item.id;
                const affordable = coinsDisplay >= item.price;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-3 transition ${
                      isSelected ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectOutfit(item)}
                      className="flex flex-1 items-center gap-2 text-left"
                    >
                      <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                      {isEquipped ? (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-indigo-600">
                          Equipped
                        </span>
                      ) : isOwned ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
                          Owned
            </span>
                      ) : null}
                    </button>
                    {isOwned ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleEquipOwned(item);
                        }}
                        className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                          isEquipped
                            ? 'bg-indigo-500 text-white'
                            : 'border border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                        }`}
                      >
                        {isEquipped ? 'Equipped' : 'Equip'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenPurchaseModal(item);
                        }}
                        className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition ${
                          affordable
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {renderCoinValue(item.price, 'h-4 w-4')}
                        <span>Buy</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-xl">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Featured Fit
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-800">
                {selectedItem ? selectedItem.name : 'Pick an outfit'}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {selectedItem
                  ? selectedItem.description
                  : 'Choose an outfit from the sidebar to see it on your swimmer.'}
              </p>
            </div>
            {selectedItem ? (
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Status
                </p>
                <p className="text-sm font-semibold text-slate-600">
                  {selectedEquipped
                    ? 'Equipped'
                    : selectedOwned
                    ? 'Owned'
                    : `${selectedItem.price} Coins`}
                </p>
                {!selectedOwned ? (
                  <p className="mt-1 text-xs text-amber-600">
                    {coinsDisplay >= selectedItem.price
                      ? 'Buy from the sidebar to unlock.'
                      : `Need ${Math.max(0, selectedItem.price - coinsDisplay)} more coins.`}
                  </p>
                ) : null}
              </div>
            ) : null}
        </div>

          <div className="relative mx-auto flex h-[520px] w-full max-w-[520px] items-center justify-center">
            {overlayItem ? (
              <Image
                src={overlayItem.imagePath}
                alt={`${overlayItem.name} preview`}
                width={520}
                height={520}
                priority
                className="h-full w-full animate-float object-contain drop-shadow-[0_25px_70px_rgba(63,61,86,0.25)]"
              />
            ) : (
              <Image
                src={activeBuddyState.asset}
                alt={activeBuddyState.alt}
                width={520}
                height={520}
                priority
                className="h-full w-full animate-float object-contain drop-shadow-[0_25px_70px_rgba(63,61,86,0.25)]"
              />
            )}
          </div>
        </section>
      </main>
    );
  };

  return (
    <>
      {activeTab === 'shop' ? renderShopView() : renderHomeView()}

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

      <Modal
        title={purchaseCandidate ? `Purchase ${purchaseCandidate.name}?` : ''}
        open={Boolean(purchaseCandidate)}
        onClose={handleClosePurchaseModal}
      >
        {purchaseCandidate ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100">
                <Image
                  src={purchaseCandidate.imagePath}
                  alt={purchaseCandidate.name}
                  width={56}
                  height={56}
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">{purchaseCandidate.name}</p>
                <p className="text-xs text-slate-500">{purchaseCandidate.description}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
              <span className="inline-flex items-center gap-2">
                <span>Cost:</span>
                {renderCoinValue(purchaseCandidate.price)}
              </span>
              <span className="mx-2 text-slate-400">·</span>
              <span className="inline-flex items-center gap-2">
                <span>Balance:</span>
                {renderCoinValue(coinsDisplay)}
              </span>
            </div>
            {coinsDisplay < purchaseCandidate.price ? (
              <p className="text-xs font-semibold text-rose-500">
                Need {purchaseCandidate.price - coinsDisplay} more coins to purchase this item.
              </p>
            ) : (
              <p className="text-xs text-emerald-600">You have enough coins to unlock this outfit.</p>
            )}
            <div className="flex justify-end gap-3">
            <button
              type="button"
                onClick={handleClosePurchaseModal}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            >
                Cancel
            </button>
            <button
              type="button"
                onClick={handleConfirmPurchase}
                disabled={coinsDisplay < purchaseCandidate.price}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  coinsDisplay < purchaseCandidate.price
                    ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <span>Buy for</span>
                  {renderCoinValue(purchaseCandidate.price)}
                </span>
            </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal title="Progress History" open={activeModal === 'history'} onClose={closeModal}>
        <HistoryPanel history={history} loading={historyLoading} />
      </Modal>

      <Modal title="Settings & Debug" open={activeModal === 'settings'} onClose={closeModal}>
        <SettingsPanel loading={loading} onReset={handleReset} />
      </Modal>
    </>
  );
}
