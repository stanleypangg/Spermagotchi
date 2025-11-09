'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import petriDish from '@/public/petri.png';
import chat1 from '@/public/chat1.png';
import chat2 from '@/public/chat2.png';
import chat3 from '@/public/chat3.png';
import chat4 from '@/public/chat4.png';
import chat5 from '@/public/chat5.png';
import chat6 from '@/public/chat6.png';
import LandingScreen from './components/LandingScreen';
import HabitPanel from './components/HabitPanel';
import HistoryPanel from './components/HistoryPanel';
import SettingsPanel from './components/SettingsPanel';
import NavigationBar from './components/NavigationBar';
import Modal from './components/Modal';
import StreakModal from './components/StreakModal';
import {
  NAV_ITEMS,
  DEFAULT_HABIT_FORM,
  WELLNESS_STATES,
  HABIT_IMAGE_OVERRIDES,
  SHOP_CLOTHING_ITEMS,
  SHOP_BACKGROUND_ITEMS,
  GOOD_HABITS_CONFIG,
  BAD_HABITS_CONFIG,
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
const BOTTOM_NAV_HEIGHT = 88;
const DEFAULT_PREVIEW_BACKGROUND = null;
const DEFAULT_STARTING_COINS = 250;
const DEFAULT_HOME_BACKGROUND = null;
const GOOD_HABIT_KEYS = GOOD_HABITS_CONFIG.map((habit) => habit.key);
const BAD_HABIT_KEYS = BAD_HABITS_CONFIG.map((habit) => habit.key);
const CHAT_BUBBLE_IMAGES = [chat1, chat2, chat3, chat4, chat5, chat6];
const STAT_DISPLAY_CONFIG = Object.freeze([
  { key: 'motility', label: 'Motility', abbr: 'MOT' },
  { key: 'linearity', label: 'Linearity', abbr: 'LIN' },
  { key: 'flow', label: 'Flow', abbr: 'FLOW' },
  { key: 'signals', label: 'Signals', abbr: 'SIG' },
]);

export default function Home() {
  const router = useRouter();
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
  const [ownedBackgrounds, setOwnedBackgrounds] = useState([]);
  const [equippedBackground, setEquippedBackground] = useState(null);
  const [previewBackground, setPreviewBackground] = useState(null);
  const [purchaseCandidate, setPurchaseCandidate] = useState(null);
  const [showTodos, setShowTodos] = useState(false);
  const [chatBubbleIndex, setChatBubbleIndex] = useState(0);
  const [shopTab, setShopTab] = useState('outfits');
  const [previewBackgroundLoaded, setPreviewBackgroundLoaded] = useState(true);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const currentBackgroundPreviewId = previewBackground ?? equippedBackground ?? null;

  useEffect(() => {
    if (!showTodos || typeof window === 'undefined') {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowTodos(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showTodos]);

  const panelHeight = '100vh';
  const habitValues = Object.values(habitForm ?? {});
  const totalHabits = habitValues.length;
  const completedHabits = habitValues.filter(Boolean).length;
  const completionPercent =
    totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
  const tasksRemaining = Math.max(totalHabits - completedHabits, 0);
  const safeChatIndex =
    CHAT_BUBBLE_IMAGES.length > 0 && Number.isFinite(chatBubbleIndex)
      ? chatBubbleIndex % CHAT_BUBBLE_IMAGES.length
      : 0;
  const activeChatBubble = CHAT_BUBBLE_IMAGES[safeChatIndex] ?? chat1;
  const chatBubbleAlt = `Buddy chat bubble ${safeChatIndex + 1}`;
  const completionHeadline =
    tasksRemaining === 0
      ? 'Nice work, everything is logged!'
      : tasksRemaining === 1
      ? 'Almost there - 1 habit left'
      : `Keep going - ${tasksRemaining} habits left`;
  const completionSubcopy = submitting
    ? 'Syncing your latest check-in - keep the app open.'
    : tasksRemaining === 0
    ? 'Take a breath and enjoy the streak you are building.'
    : 'Small, consistent check-ins keep your swimmer thriving.';
  const totalGoodHabits = GOOD_HABIT_KEYS.length;
  const totalBadHabits = BAD_HABIT_KEYS.length;
  const completedGoodHabits = GOOD_HABIT_KEYS.reduce(
    (count, key) => count + (habitForm?.[key] ? 1 : 0),
    0,
  );
  const completedBadHabits = BAD_HABIT_KEYS.reduce(
    (count, key) => count + (habitForm?.[key] ? 1 : 0),
    0,
  );
  const goodPercent =
    totalGoodHabits > 0 ? Math.round((completedGoodHabits / totalGoodHabits) * 100) : 0;
  const badPercent =
    totalBadHabits > 0 ? Math.round((completedBadHabits / totalBadHabits) * 100) : 0;

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

  const handleChatBubbleCycle = useCallback(() => {
    setChatBubbleIndex((previous) => (previous + 1) % CHAT_BUBBLE_IMAGES.length);
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
      if (tab === 'racing') {
        setShowTodos(false);
        router.push('/race');
        return;
      }
      if (tab === 'leaderboards') {
        setShowTodos(false);
        router.push('/leaderboards');
        return;
      }
      setActiveTab(tab);
      setActiveModal(tab);
    },
    [closeModal, router],
  );

  const fetchSpermState = useCallback(async (id) => {
    const data = await fetchSpermStateApi(id);
    if (!data) {
      return null;
    }
    setSperm(data.sperm);
    setDerived(data.derived);
    setLatestCheckIn(data.latestCheckIn ?? null);
    
    // Load shop items from sperm data
    if (data.sperm) {
      if (data.sperm.ownedClothing) setOwnedClothing(data.sperm.ownedClothing);
      if (data.sperm.equippedClothing !== undefined) setEquippedClothing(data.sperm.equippedClothing);
      if (data.sperm.ownedBackgrounds) setOwnedBackgrounds(data.sperm.ownedBackgrounds);
      if (data.sperm.equippedBackground !== undefined) setEquippedBackground(data.sperm.equippedBackground);
      
      // Load today's habit form
      if (data.sperm.todayHabits) {
        setHabitForm({ ...DEFAULT_HABIT_FORM, ...data.sperm.todayHabits });
      }
    }
    
    return data;
  }, []);

  const fetchHistory = useCallback(async (id, limit = 14) => {
    setHistoryLoading(true);
    try {
      const data = await fetchHistoryData(id, limit);
      setHistory(data.history ?? []);
    } catch (err) {
      // Silently fail - history is optional
      console.log('History not available (expected for new system)');
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const createRemoteSperm = useCallback(async (name) => {
    return createRemoteSpermApi(name);
  }, []);

  // Shop items now stored in player data JSON file instead of localStorage

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
    if (activeTab === 'shop') {
      return;
    }
    setPreviewClothing(null);
    setPreviewBackground(null);
    setPreviewBackgroundLoaded(true);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'shop') {
      return;
    }
    if (!currentBackgroundPreviewId) {
      setPreviewBackgroundLoaded(true);
      return;
    }
    setPreviewBackgroundLoaded(false);
  }, [activeTab, currentBackgroundPreviewId]);

  useEffect(() => {
    if (activeTab !== 'home') {
      return;
    }
    const override = selectOverrideFromHabits(habitForm);
    setBuddyOverride((current) => {
      if (!override && !current) {
        return current;
      }
      if (override && current && override.key === current.key) {
        return current;
      }
      return override ?? null;
    });
  }, [activeTab, habitForm, selectOverrideFromHabits]);

  useEffect(() => {
    let isCancelled = false;

    async function init() {
      if (typeof window === 'undefined') {
        return;
      }
      setLoading(true);
      setError(null);

      const storedName = window.localStorage.getItem('player-name');

      if (!storedName) {
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
      const res = await fetch(`/api/player?name=${encodeURIComponent(storedName)}`);
      const data = await res.json();
      
      if (!data || !data.player) {
        window.localStorage.removeItem('player-name');
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
      
      // Set the player data directly from the API response
      if (!isCancelled) {
        setSpermId(storedName);
        setShowLanding(false);
        
        // Map player data to sperm format
        const playerData = data.player;
        setSperm({
          id: storedName,
          name: playerData.name,
          stats: playerData.stats,
          elo: playerData.elo,
          spermPoints: playerData.spermPoints,
          raceHistory: playerData.raceHistory,
          currentStreak: playerData.currentStreak || 0,
          longestStreak: playerData.longestStreak || 0,
          lastCheckInDate: playerData.lastCheckInDate,
          currentDayIndex: 1,
          createdAt: playerData.createdAt,
          history: [],
        });
        
        // Load shop items
        if (playerData.ownedClothing) setOwnedClothing(playerData.ownedClothing);
        if (playerData.equippedClothing !== undefined) setEquippedClothing(playerData.equippedClothing);
        if (playerData.ownedBackgrounds) setOwnedBackgrounds(playerData.ownedBackgrounds);
        if (playerData.equippedBackground !== undefined) setEquippedBackground(playerData.equippedBackground);
        
        // Load today's habit form
        if (playerData.todayHabits) {
          setHabitForm({ ...DEFAULT_HABIT_FORM, ...playerData.todayHabits });
        }
        
        // Calculate derived stats
        const derivedStats = {
          overallHealthScore: (
            0.35 * playerData.stats.motility +
            0.30 * playerData.stats.linearity +
            0.20 * playerData.stats.flow +
            0.15 * playerData.stats.signals
          ),
          performanceRating: (
            0.45 * playerData.stats.motility +
            0.35 * playerData.stats.linearity +
            0.20 * playerData.stats.signals
          ),
          consistencyScore: 50,
        };
        setDerived(derivedStats);
        setLatestCheckIn(null);
      }
    } catch (err) {
      window.localStorage.removeItem('player-name');
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
    // Always sync coins with sperm points from player data
    const points = sperm?.spermPoints ?? (coins !== null ? coins : DEFAULT_STARTING_COINS);
    setCoins(Math.max(0, Math.round(points)));
  }, [sperm?.spermPoints]);

  // Reload player data when page gains focus (returns from race)
  // Uses optimistic update - keeps existing data
  useEffect(() => {
    const handleFocus = async () => {
      if (spermId && typeof window !== 'undefined') {
        try {
          const res = await fetch(`/api/player?name=${encodeURIComponent(spermId)}`);
          const data = await res.json();
          if (data?.player) {
            const playerData = data.player;
            
            // Optimistic update - merge with existing
            setSperm(prev => ({
              ...prev,
              id: spermId,
              name: playerData.name,
              stats: playerData.stats,
              elo: playerData.elo,
              spermPoints: playerData.spermPoints,
              raceHistory: playerData.raceHistory,
              currentStreak: playerData.currentStreak || 0,
              longestStreak: playerData.longestStreak || 0,
              lastCheckInDate: playerData.lastCheckInDate,
            }));
            
            // Update coins
            setCoins(Math.max(0, Math.round(playerData.spermPoints ?? 0)));
          }
        } catch (err) {
          console.error('Failed to refresh player data:', err);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [spermId]);

  useEffect(() => {
    if ((activeTab === 'history' || activeModal === 'history') && spermId) {
      fetchHistory(spermId);
    }
  }, [activeModal, activeTab, fetchHistory, spermId]);

  useEffect(() => {
    if (activeTab !== 'shop') {
      setPreviewClothing((prev) => (prev != null ? null : prev));
      setPreviewBackground((prev) => (prev != null ? null : prev));
      setPreviewBackgroundLoaded(true);
    }
  }, [activeTab]);

  // Refresh player data when opening shop or home (to get updated points/stats after racing)
  // Uses optimistic updates - keeps existing data while fetching, debounced to prevent flashing
  useEffect(() => {
    if ((activeTab === 'shop' || activeTab === 'home') && spermId) {
      // Debounce the refresh to avoid rapid calls
      const timeoutId = setTimeout(async () => {
        try {
          const res = await fetch(`/api/player?name=${encodeURIComponent(spermId)}`);
          const data = await res.json();
          if (data?.player) {
            const playerData = data.player;
            
            // Update sperm state (keep existing data, only update what changed)
            setSperm(prev => ({
              ...prev,
              id: spermId,
              name: playerData.name,
              stats: playerData.stats,
              elo: playerData.elo,
              spermPoints: playerData.spermPoints,
              raceHistory: playerData.raceHistory,
              currentStreak: playerData.currentStreak || 0,
              longestStreak: playerData.longestStreak || 0,
              lastCheckInDate: playerData.lastCheckInDate,
              currentDayIndex: 1,
              createdAt: playerData.createdAt,
              history: [],
            }));
            
            // Update coins
            setCoins(Math.max(0, Math.round(playerData.spermPoints ?? 0)));
            
            // Update shop items (but preserve preview selections)
            if (playerData.ownedClothing) setOwnedClothing(playerData.ownedClothing);
            if (playerData.equippedClothing !== undefined && !previewClothing) {
              setEquippedClothing(playerData.equippedClothing);
            }
            if (playerData.ownedBackgrounds) setOwnedBackgrounds(playerData.ownedBackgrounds);
            if (playerData.equippedBackground !== undefined && !previewBackground) {
              setEquippedBackground(playerData.equippedBackground);
            }
            
            // Load today's habit form
            if (playerData.todayHabits) {
              setHabitForm({ ...DEFAULT_HABIT_FORM, ...playerData.todayHabits });
            }
          }
        } catch (err) {
          console.error('Failed to refresh player data:', err);
        }
      }, 100); // 100ms debounce
      
      return () => clearTimeout(timeoutId);
    }
  }, [activeTab, spermId, previewClothing, previewBackground]);

  // Initialize preview when switching shop tabs
  useEffect(() => {
    if (shopTab === 'backgrounds' && !previewBackground && equippedBackground) {
      setPreviewBackground(equippedBackground);
    } else if (shopTab === 'outfits' && !previewClothing && equippedClothing) {
      setPreviewClothing(equippedClothing);
    }
  }, [shopTab]);

  useEffect(() => {
    if (previewBackground) {
      setPreviewBackgroundLoaded(false);
    } else {
      setPreviewBackgroundLoaded(true);
    }
  }, [previewBackground]);

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
      return false;
    }

    setCreating(true);
    setCreateError(null);
    setError(null);
    setLoading(true);

    try {
      // Create/fetch player using simple API
      const res = await fetch(`/api/player?name=${encodeURIComponent(trimmedName)}`);
      const data = await res.json();
      
      if (!data || !data.player) {
        throw new Error('Could not create player.');
      }
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('player-name', trimmedName);
      }
      setSpermId(trimmedName);
      setHabitForm({ ...DEFAULT_HABIT_FORM });
      setBuddyOverride(null);
      setHistory([]);
      setActiveTab('home');
      setCreateName('');
      scheduleFeedbackClear('Buddy hatched! 🌟');
      return true;
    } catch (err) {
      console.error(err);
      const message =
        err?.message && err.message !== 'state-failed'
          ? err.message
          : 'Could not hatch buddy. Try again.';
      setCreateError(message);
      return false;
    } finally {
      setCreating(false);
      setLoading(false);
    }
  }, [createName, createRemoteSperm, fetchSpermState, scheduleFeedbackClear]);

  const syncHabitForm = useCallback(
    async (nextHabits, previousHabits) => {
      if (!spermId) {
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        const result = await fetch(`/api/sperm/${spermId}/checkins`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ habits: nextHabits }),
        });
        const data = await result.json();
        
        if (!result.ok) {
          throw new Error(data.error || 'Failed to submit habits');
        }
        
        // Show streak bonus feedback if applicable
        if (data.streakBonus > 0 || data.streakPoints > 0) {
          let message = '✅ Habits logged!';
          if (data.streakBonus > 0) {
            message += ` 🔥 Streak Bonus: +${data.streakBonus} to all stats!`;
          }
          if (data.streakPoints > 0) {
            message += ` 💰 +${data.streakPoints} points!`;
          }
          scheduleFeedbackClear(message);
        }
        
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
      
      // Save habit form to player store
      if (spermId) {
        fetch('/api/player', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: spermId,
            data: { todayHabits: nextHabits },
          }),
        }).catch(err => console.error('Failed to save habits:', err));
      }
    },
    [habitForm, buddyOverride, selectOverrideFromHabits, syncHabitForm, spermId],
  );

  const handleReset = () => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.removeItem('player-name');
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
    setCoins(null);
    setOwnedClothing([]);
    setEquippedClothing(null);
    setPreviewClothing(null);
    setOwnedBackgrounds([]);
    setEquippedBackground(null);
    setPreviewBackground(null);
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

  const latestStatDelta = latestCheckIn?.statDelta ?? null;
  const headerStats = STAT_DISPLAY_CONFIG.map((stat) => {
    const rawValue = sperm?.stats?.[stat.key];
    const value = Number.isFinite(rawValue) ? Math.round(rawValue) : '--';
    const rawDelta =
      latestStatDelta && Number.isFinite(latestStatDelta[`${stat.key}Delta`])
        ? latestStatDelta[`${stat.key}Delta`]
        : null;

    let trendIcon = '▬';
    let trendColor = 'text-slate-400';
    let trendLabel = 'Even';

    if (rawDelta === null) {
      trendIcon = '▬';
      trendColor = 'text-slate-300';
      trendLabel = '—';
    } else if (rawDelta > 0.05) {
      trendIcon = '▲';
      trendColor = 'text-emerald-500';
      trendLabel = `+${rawDelta.toFixed(1)}`;
    } else if (rawDelta < -0.05) {
      trendIcon = '▼';
      trendColor = 'text-rose-500';
      trendLabel = `${rawDelta.toFixed(1)}`;
    }

    return {
      ...stat,
      value,
      trendIcon,
      trendColor,
      trendLabel,
    };
  });

  const activeBuddyState = buddyOverride ?? wellnessState;
  const coinsDisplay =
    coins !== null
      ? coins
      : Number.isFinite(derived?.overallHealthScore)
      ? Math.round(derived.overallHealthScore)
      : 0;
  const equippedOutfitItem =
    SHOP_CLOTHING_ITEMS.find((item) => item.id === equippedClothing) ?? null;
  const previewOutfitItem = previewClothing
    ? SHOP_CLOTHING_ITEMS.find((item) => item.id === previewClothing) ?? null
    : null;
  const equippedBackgroundItem =
    SHOP_BACKGROUND_ITEMS.find((item) => item.id === equippedBackground) ?? null;
  const previewBackgroundItem = previewBackground
    ? SHOP_BACKGROUND_ITEMS.find((item) => item.id === previewBackground) ?? null
    : null;
const currentBackgroundPreviewItem = previewBackgroundItem ?? equippedBackgroundItem ?? null;

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
    async (item) => {
      setError(null);
      setEquippedClothing(item.id);
      setPreviewClothing(item.id);
      
      // Save to player data
      if (spermId) {
        try {
          await fetch('/api/player', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: spermId,
              data: { equippedClothing: item.id },
            }),
          });
        } catch (err) {
          console.error('Failed to save equipped clothing:', err);
        }
      }
    },
    [spermId],
  );

  const handleUnequipOutfit = useCallback(async () => {
    setError(null);
    setEquippedClothing(null);
    setPreviewClothing(null);
    
    // Save to player data
    if (spermId) {
      try {
        await fetch('/api/player', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: spermId,
            data: { equippedClothing: null },
          }),
        });
      } catch (err) {
        console.error('Failed to save unequip:', err);
      }
    }
  }, [spermId]);

  const handleSelectBackground = useCallback(
    (item) => {
      setError(null);
      setPreviewBackground(item.id);
      setPreviewBackgroundLoaded(false); // Trigger reload
      if (ownedBackgrounds.includes(item.id)) {
        setEquippedBackground(item.id);
      }
    },
    [ownedBackgrounds],
  );

  const handleEquipBackground = useCallback(
    async (item) => {
      setError(null);
      setEquippedBackground(item.id);
      setPreviewBackground(item.id);
      
      // Save to player data
      if (spermId) {
        try {
          await fetch('/api/player', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: spermId,
              data: { equippedBackground: item.id },
            }),
          });
        } catch (err) {
          console.error('Failed to save equipped background:', err);
        }
      }
      scheduleFeedbackClear(`${item.name} applied!`);
    },
    [scheduleFeedbackClear, spermId],
  );

  const handleClearBackground = useCallback(async () => {
    setError(null);
    setEquippedBackground(null);
    setPreviewBackground(null);
    
    // Save to player data
    if (spermId) {
      try {
        await fetch('/api/player', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: spermId,
            data: { equippedBackground: null },
          }),
        });
      } catch (err) {
        console.error('Failed to save background reset:', err);
      }
    }
    scheduleFeedbackClear('Background reset.');
  }, [scheduleFeedbackClear, spermId]);

  const handleOpenPurchaseModal = useCallback((item, category) => {
    setError(null);
    if (category === 'background') {
      setPreviewBackground(item.id);
      setPreviewBackgroundLoaded(false);
    } else {
      setPreviewClothing(item.id);
    }
    setPurchaseCandidate({ category, item });
  }, []);

  const handleClosePurchaseModal = useCallback(() => {
    setPurchaseCandidate(null);
  }, []);

  const handleConfirmPurchase = useCallback(async () => {
    if (!purchaseCandidate) {
      return;
    }
    const { item, category } = purchaseCandidate;
    const { id, price, name } = item;
    const currentCoins = coins !== null ? coins : coinsDisplay;
    if (currentCoins < price) {
      setError(`Need ${Math.max(0, price - currentCoins)} more coins to buy ${name}.`);
      return;
    }

    const newCoins = Math.max(0, currentCoins - price);
    
    // Optimistic update - update UI immediately
    setCoins(newCoins);

    if (category === 'background') {
      const newOwnedBackgrounds = ownedBackgrounds.includes(id) ? ownedBackgrounds : [...ownedBackgrounds, id];
      setOwnedBackgrounds(newOwnedBackgrounds);
      setEquippedBackground(id);
      setPreviewBackground(id);
      
      // Save to player data
      if (spermId) {
        try {
          await fetch('/api/player', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: spermId,
              data: {
                spermPoints: newCoins,
                ownedBackgrounds: newOwnedBackgrounds,
                equippedBackground: id,
              },
            }),
          });
        } catch (err) {
          console.error('Failed to save purchase:', err);
        }
      }
      scheduleFeedbackClear(`Background "${name}" unlocked!`);
    } else {
      const newOwnedClothing = ownedClothing.includes(id) ? ownedClothing : [...ownedClothing, id];
      setOwnedClothing(newOwnedClothing);
      setEquippedClothing(id);
      setPreviewClothing(id);
      
      // Save to player data
      if (spermId) {
        try {
          await fetch('/api/player', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: spermId,
              data: {
                spermPoints: newCoins,
                ownedClothing: newOwnedClothing,
                equippedClothing: id,
              },
            }),
          });
        } catch (err) {
          console.error('Failed to save purchase:', err);
        }
      }
      scheduleFeedbackClear(`Fresh drip! ${name} unlocked.`);
    }
    setPurchaseCandidate(null);
    setError(null);
  }, [
    coins,
    coinsDisplay,
    purchaseCandidate,
    scheduleFeedbackClear,
    spermId,
    ownedClothing,
    ownedBackgrounds,
  ]);

  const homeDisplayOutfit = equippedOutfitItem;
  const homeBackgroundImage = equippedBackgroundItem?.imagePath ?? DEFAULT_HOME_BACKGROUND;
  const homeBackgroundAlt = equippedBackgroundItem
    ? `${equippedBackgroundItem.name} background`
    : 'Default background';

  if (showLanding) {
    return (
      <LandingScreen
        name={createName}
        onNameChange={handleLandingNameChange}
        onSubmit={handleLandingSubmit}
        creating={creating}
        error={createError}
        onComplete={() => setShowLanding(false)}
      />
    );
  }

  const renderHomeView = () => (
    <main className="relative flex min-h-[calc(100vh-88px)] flex-col pb-[88px]">
      {homeBackgroundImage ? (
        <>
          <Image
            src={homeBackgroundImage}
            alt={homeBackgroundAlt}
            fill
            priority
            unoptimized
            className="absolute inset-0 -z-10 object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-white/30 backdrop-blur-[2px]" />
        </>
      ) : (
        <div className="absolute inset-0 -z-10 bg-white" />
      )}
      <header className="relative z-10 flex flex-col items-center px-6 pt-6 pb-4">
        {/* Streak Indicator Button - Always show */}
        {sperm && (
          <button
            type="button"
            onClick={() => setShowStreakModal(true)}
            className="absolute right-6 top-6 group"
          >
            <div className={`flex items-center gap-2 rounded-full border-2 px-4 py-2 shadow-lg transition hover:scale-105 hover:shadow-xl ${
              (sperm.currentStreak || 0) > 0
                ? 'border-orange-300 bg-gradient-to-r from-orange-100 to-amber-100'
                : 'border-slate-300 bg-gradient-to-r from-slate-100 to-slate-200'
            }`}>
              <span className="text-2xl">{(sperm.currentStreak || 0) > 0 ? '🔥' : '📅'}</span>
              <div className="text-left">
                <p className={`text-[10px] font-bold uppercase tracking-wider ${
                  (sperm.currentStreak || 0) > 0 ? 'text-orange-600' : 'text-slate-500'
                }`}>Streak</p>
                <p className={`text-xl font-black ${
                  (sperm.currentStreak || 0) > 0 ? 'text-orange-700' : 'text-slate-600'
                }`}>{sperm.currentStreak || 0}</p>
              </div>
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition whitespace-nowrap rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-white shadow-lg">
              View Rewards
            </div>
          </button>
        )}
        
        <div className="flex w-full max-w-3xl flex-wrap justify-center gap-4 text-left">
          {headerStats.map((stat) => {
            const tooltips = {
              motility: 'Swimming speed and energy. Helps you move faster in races.',
              linearity: 'Path efficiency. Better linearity = straighter swimming paths.',
              flow: 'Adaptation to fluid environments. Reduces resistance in flow zones.',
              signals: 'Chemical sensing and navigation. Boosts performance in gradient zones.',
            };
            
            // Calculate stat rank
            const getStatRank = (value) => {
              if (value >= 95) return { rank: 'SSS+', color: 'from-yellow-400 to-orange-400', textColor: 'text-yellow-600', glow: 'shadow-yellow-500/50' };
              if (value >= 90) return { rank: 'SSS', color: 'from-purple-400 to-pink-400', textColor: 'text-purple-600', glow: 'shadow-purple-500/50' };
              if (value >= 80) return { rank: 'SS', color: 'from-red-400 to-rose-400', textColor: 'text-red-600', glow: 'shadow-red-500/30' };
              if (value >= 70) return { rank: 'S', color: 'from-orange-400 to-amber-400', textColor: 'text-orange-600', glow: 'shadow-orange-500/30' };
              if (value >= 60) return { rank: 'A', color: 'from-emerald-400 to-teal-400', textColor: 'text-emerald-600', glow: 'shadow-emerald-500/20' };
              if (value >= 50) return { rank: 'B', color: 'from-blue-400 to-cyan-400', textColor: 'text-blue-600', glow: 'shadow-blue-500/20' };
              return { rank: 'C', color: 'from-slate-400 to-slate-500', textColor: 'text-slate-600', glow: '' };
            };
            
            const statValue = typeof stat.value === 'number' ? stat.value : 0;
            const rankInfo = getStatRank(statValue);
            
            return (
              <div
                key={stat.key}
                className="group relative flex min-w-[140px] flex-1 basis-[160px] flex-col rounded-3xl border border-white/70 bg-white/80 px-4 py-3 text-slate-600 shadow-sm backdrop-blur transition hover:shadow-md"
              >
                {/* Rank Badge */}
                <div className={`absolute -top-2 -right-2 rounded-full bg-gradient-to-r ${rankInfo.color} px-2.5 py-1 shadow-lg ${rankInfo.glow}`}>
                  <p className="text-[10px] font-black text-white drop-shadow-md">{rankInfo.rank}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
                    {stat.abbr}
                  </span>
                  <span className={`flex items-center gap-1 text-xs font-semibold ${stat.trendColor}`}>
                    <span aria-hidden>{stat.trendIcon}</span>
                    <span>{stat.trendLabel}</span>
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.25em] text-slate-400">
                  {stat.label}
                </p>
                
                {/* Tooltip on hover */}
                <div className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-50">
                  <div className="rounded-xl bg-slate-800 px-3 py-2 shadow-xl">
                    <p className="text-xs text-white whitespace-nowrap">{tooltips[stat.key]}</p>
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 bg-slate-800" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setShowTodos((previous) => !previous)}
          aria-expanded={showTodos}
          aria-controls="daily-todos-panel"
          className={`absolute left-6 top-6 inline-flex min-h-[36px] min-w-[136px] items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 ${
            showTodos ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          tabIndex={showTodos ? -1 : undefined}
        >
          <span className="sr-only">
            {showTodos ? 'Close daily todos' : 'Open daily todos'}
          </span>
          <span aria-hidden>Daily Todos</span>
        </button>
      </header>

      <div className="relative mt-8 flex flex-1 items-stretch overflow-hidden px-6">
        <aside
          id="daily-todos-panel"
          role="dialog"
          aria-modal={showTodos}
          aria-hidden={!showTodos}
          aria-labelledby="daily-todos-title"
          className="fixed left-0 top-0 z-40 flex flex-col overflow-hidden rounded-[32px] border border-indigo-100/70 bg-white/95 px-7 pb-8 pt-9 shadow-[0_24px_60px_rgba(63,61,86,0.16)] transition-all duration-500 ease-out"
          style={{
            width: TODO_PANEL_WIDTH,
            height: panelHeight,
            maxHeight: panelHeight,
            transform: `translateX(${showTodos ? 0 : -(TODO_PANEL_WIDTH + TODO_PANEL_GAP)}px)`,
            pointerEvents: showTodos ? 'auto' : 'none',
            visibility: showTodos ? 'visible' : 'hidden',
          }}
        >
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 rounded-[32px] bg-linear-to-br from-white via-white/95 to-indigo-50/70" />
            <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-indigo-200/40 blur-3xl" />
            <div className="absolute -bottom-32 -left-20 h-48 w-48 rounded-full bg-pink-200/30 blur-3xl" />
          </div>
          <header className="flex items-start justify-between gap-6">
            <div className="space-y-2">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
                Daily Check-ins
              </p>
              <h2 id="daily-todos-title" className="text-lg font-semibold text-[#322c52]">
                Tap In
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowTodos(false)}
              className="group inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-indigo-100 bg-white/70 text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600"
              aria-label="Close daily todos"
            >
              <span aria-hidden className="block h-4 w-4">
                <svg viewBox="0 0 12 12" className="h-full w-full" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5">
                  <line x1="1" y1="1" x2="11" y2="11" />
                  <line x1="1" y1="11" x2="11" y2="1" />
                </svg>
              </span>
            </button>
          </header>
          <section className="mt-6 rounded-2xl border border-white/60 bg-white/50 p-4 shadow-sm">
            <div className="flex flex-col gap-4">
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-emerald-100/60"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={totalGoodHabits}
                aria-valuenow={completedGoodHabits}
                aria-label="Good habits logged"
              >
                <div
                  className="h-full rounded-full bg-linear-to-r from-emerald-400 via-emerald-500 to-teal-500 transition-[width] duration-500 ease-out"
                  style={{ width: `${goodPercent}%` }}
                />
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-rose-100/70"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={totalBadHabits}
                aria-valuenow={completedBadHabits}
                aria-label="Bad habits flagged"
              >
                <div
                  className="h-full rounded-full bg-linear-to-r from-rose-500 via-red-500 to-orange-500 transition-[width] duration-500 ease-out"
                  style={{ width: `${badPercent}%` }}
                />
              </div>
            </div>
          </section>
          <div className="mt-6 flex flex-1 min-h-0 flex-col rounded-2xl border border-white/60 bg-white/60 p-3 shadow-sm">
            <div
              className="flex-1 min-h-0 overflow-y-auto pr-1"
              style={{ scrollbarGutter: 'stable both-edges' }}
            >
              <HabitPanel habitForm={habitForm} onToggle={handleHabitToggle} submitting={submitting} />
            </div>
          </div>
        </aside>

        <div
          aria-hidden="true"
          onClick={() => setShowTodos(false)}
          className="fixed inset-x-0 top-0 z-30 bg-slate-950/25 transition-opacity duration-300 ease-out"
          style={{
            opacity: showTodos ? 1 : 0,
            pointerEvents: showTodos ? 'auto' : 'none',
            height: panelHeight,
          }}
        />

        <section
          className="relative z-0 flex w-full items-center justify-center transition-transform duration-500 ease-out"
        >
          <div className="flex w-full max-w-xl flex-col items-center justify-center px-4 text-center">
            <div className="relative mt-8 flex h-[360px] w-full max-w-[360px] flex-col items-center justify-center">
              <div className="animate-float absolute -right-12 z-30 w-48 -top-6 sm:-right-12 sm:w-56">
                <button
                  type="button"
                  onClick={handleChatBubbleCycle}
                  className="group relative inline-flex w-full items-center justify-center transition duration-200 hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
                  aria-label="Cycle buddy chat bubble"
                >
                  <span className="relative block h-40 w-48 sm:h-48 sm:w-56">
                    <Image
                      src={activeChatBubble}
                      alt={chatBubbleAlt}
                      fill
                      sizes="(max-width: 640px) 10rem, 12rem"
                      priority
                      className="object-contain drop-shadow-[0_12px_24px_rgba(63,61,86,0.24)]"
                    />
                  </span>
                  <span className="sr-only">Tap to cycle chat bubble</span>
                </button>
              </div>
              <Image
                src={petriDish}
                alt="Petri dish backdrop"
                width={320}
                height={320}
                className="absolute bottom-0 left-1/2 z-10 h-[240px] w-[240px] -translate-x-1/2 translate-y-12 object-contain opacity-90"
                priority
              />
              <div className="absolute left-1/2 top-1/2 z-20 flex h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                {homeDisplayOutfit ? (
                  <Image
                    src={homeDisplayOutfit.imagePath}
                    alt={homeDisplayOutfit.name}
                    width={320}
                    height={320}
                    priority
                    className="h-full w-full animate-float object-contain drop-shadow-[0_16px_32px_rgba(63,61,86,0.24)]"
                  />
                ) : (
                  <Image
                    src={activeBuddyState.asset}
                    alt={activeBuddyState.alt}
                    width={320}
                    height={320}
                    priority
                    className="h-full w-full animate-float object-contain drop-shadow-[0_16px_32px_rgba(63,61,86,0.24)]"
                  />
                )}
              </div>
            </div>
            <div className="mt-4 text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              {sperm?.name ?? 'Buddy'}
            </div>
            
            {/* Streak Display - Smaller and more subtle */}
            {sperm && (
              <div className="mt-2">
                <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 shadow-sm ${
                  (sperm.currentStreak || 0) > 0 
                    ? 'border-orange-200 bg-orange-50'
                    : 'border-slate-200 bg-slate-50'
                }`}>
                  <span className="text-sm">{(sperm.currentStreak || 0) > 0 ? '🔥' : '📅'}</span>
                  <div className="flex items-baseline gap-1">
                    <p className={`text-base font-black ${
                      (sperm.currentStreak || 0) > 0 ? 'text-orange-600' : 'text-slate-500'
                    }`}>{sperm.currentStreak || 0}</p>
                    <p className={`text-[10px] font-semibold uppercase ${
                      (sperm.currentStreak || 0) > 0 ? 'text-orange-500' : 'text-slate-400'
                    }`}>day{(sperm.currentStreak || 0) !== 1 ? 's' : ''}</p>
                  </div>
                  {(sperm.longestStreak || 0) > (sperm.currentStreak || 0) && (
                    <>
                      <div className="h-3 w-px bg-slate-300" />
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs">👑</span>
                        <p className="text-sm font-bold text-purple-600">{sperm.longestStreak}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            
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
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setDebugWellness(null)}
                  className="text-xs font-semibold text-indigo-500 underline"
                >
                  reset
                </button>
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!spermId) return;
                      try {
                        const res = await fetch('/api/player/skip-day', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            name: spermId,
                            habits: habitForm, // Submit current habits
                          }),
                        });
                        const data = await res.json();
                        if (data.player) {
                          scheduleFeedbackClear(data.message || 'Day advanced!');
                          // Reload player data
                          await fetchSpermState(spermId);
                          setHabitForm({ ...DEFAULT_HABIT_FORM });
                          setBuddyOverride(null);
                        }
                      } catch (err) {
                        console.error('Failed to advance day:', err);
                        setError('Failed to advance day');
                      }
                    }}
                    className="rounded-full border-2 border-orange-300 bg-gradient-to-r from-orange-100 to-amber-100 px-4 py-2 text-sm font-bold text-orange-700 shadow-md transition hover:from-orange-200 hover:to-amber-200 hover:scale-105"
                  >
                    ⏭️ Next Day (Demo)
                  </button>
                  <p className="text-[10px] text-slate-400 text-center max-w-[200px]">
                    Advance to tomorrow & process check-in. Streaks only count when a day passes!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );

  const renderShopView = () => {
    const selectedOutfitId = previewClothing ?? equippedClothing ?? null;
    const selectedOutfit =
      SHOP_CLOTHING_ITEMS.find((item) => item.id === selectedOutfitId) ?? null;
    const overlayOutfit = previewOutfitItem ?? null;

    const isBackgroundTab = shopTab === 'backgrounds';
    
    // Calculate background preview - use previewBackground if it exists
    const selectedBackgroundId = previewBackground ?? equippedBackground ?? null;
    const overlayBackgroundItem = selectedBackgroundId 
      ? SHOP_BACKGROUND_ITEMS.find((item) => item.id === selectedBackgroundId) 
      : null;

    const sidebarItems = isBackgroundTab ? SHOP_BACKGROUND_ITEMS : SHOP_CLOTHING_ITEMS;
    const selectedBackground = overlayBackgroundItem;

    const selectedItem = isBackgroundTab ? selectedBackground : previewOutfitItem ?? null;
    const selectedOwned = selectedItem
      ? isBackgroundTab
        ? ownedBackgrounds.includes(selectedItem.id)
        : ownedClothing.includes(selectedItem.id)
      : false;
    const selectedEquipped = selectedItem
      ? isBackgroundTab
        ? equippedBackground === selectedItem.id
        : equippedClothing === selectedItem.id
      : false;
    const statusLabel = activeBuddyState?.label ?? 'Steady';
    const statusTitle = selectedItem
      ? isBackgroundTab
        ? 'Featured Background'
        : 'Featured Fit'
      : isBackgroundTab
      ? ''
      : 'Current Status';
    const currentFitLabel = equippedOutfitItem?.name ?? null;
    const emptyTitle = isBackgroundTab ? 'Pick a background' : statusLabel;
    const emptyDescription = isBackgroundTab
      ? 'Choose a background from the sidebar to preview the environment.'
      : currentFitLabel
      ? `Your buddy is currently ${statusLabel.toLowerCase()} wearing the ${currentFitLabel}. Pick an outfit to preview a new look.`
      : `Your buddy is currently ${statusLabel.toLowerCase()}. Pick an outfit to preview a new look.`;

    return (
      <main className="grid min-h-[calc(100vh-88px)] max-h-[calc(100vh-88px)] grid-rows-1 gap-6 overflow-hidden bg-white px-4 py-8 md:grid-cols-[320px_1fr] md:px-12">
        <aside className="flex flex-col gap-4 overflow-hidden">
          <div className="border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  <span>Sperm Count</span>
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
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-hidden rounded-3xl border border-slate-200 bg-white px-4 py-5 shadow-sm">
            <header className="px-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Shop
              </p>
              <div className="mt-3 flex gap-1 rounded-full bg-slate-100 p-1 text-xs font-semibold text-slate-500">
                {[
                  { id: 'outfits', label: 'Outfits' },
                  { id: 'backgrounds', label: 'Backgrounds' },
                ].map((tab) => {
                  const isActive = shopTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setShopTab(tab.id);
                        if (tab.id === 'outfits') {
                          setPreviewBackground(equippedBackground ?? null);
                        } else {
                          setPreviewClothing(equippedClothing ?? null);
                        }
                      }}
                      className={`flex-1 rounded-full px-3 py-1 transition ${
                        isActive ? 'bg-white text-slate-800 shadow-sm' : 'hover:text-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
              {sidebarItems.map((item) => {
                const isOwned = isBackgroundTab
                  ? ownedBackgrounds.includes(item.id)
                  : ownedClothing.includes(item.id);
                const isEquipped = isBackgroundTab
                  ? equippedBackground === item.id
                  : equippedClothing === item.id;
                const isSelected = isBackgroundTab
                  ? selectedBackgroundId === item.id
                  : previewClothing === item.id || (!previewClothing && selectedOutfitId === item.id);
                const affordable = coinsDisplay >= item.price;

                return isBackgroundTab ? (
                  // Background cards - vertical layout with large preview
                  <div
                    key={item.id}
                    className={`flex flex-col gap-3 rounded-2xl border p-3 transition ${
                      isSelected ? 'border-indigo-300 bg-indigo-50 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectBackground(item)}
                      className="flex items-center gap-3 text-left"
                    >
                      <div className="relative h-20 w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                        <Image
                          src={item.imagePath}
                          alt={`${item.name} background thumbnail`}
                          fill
                          className="object-cover"
                          sizes="280px"
                          priority={isSelected}
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-black/5" />
                        {isEquipped && (
                          <div className="absolute top-2 right-2 rounded-full bg-indigo-500 px-2 py-1 text-[10px] font-bold text-white shadow-lg">
                            ✓ Applied
                          </div>
                        )}
                      </div>
                    </button>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      {isOwned ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEquipBackground(item);
                          }}
                          className={`flex-1 rounded-full px-4 py-2 text-xs font-bold transition ${
                            isEquipped
                              ? 'bg-indigo-500 text-white cursor-default'
                              : 'border-2 border-indigo-300 text-indigo-600 hover:bg-indigo-50'
                          }`}
                          disabled={isEquipped}
                        >
                          {isEquipped ? '✓ Applied' : 'Apply'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenPurchaseModal(item, 'background');
                          }}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
                            affordable
                              ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                          disabled={!affordable}
                        >
                          {renderCoinValue(item.price, 'h-4 w-4')}
                          <span>Buy</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  // Outfit cards - original horizontal layout
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-3 transition ${
                      isSelected ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectOutfit(item)}
                      className="flex flex-1 items-center gap-3 text-left"
                    >
                      <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                      {isOwned ? (
                        <span
                          className={`ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                            isEquipped
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                          aria-label={isEquipped ? 'Equipped' : 'Owned'}
                        >
                          {isEquipped ? '✓' : '•'}
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
                        className={`inline-flex min-w-[104px] items-center justify-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition ${
                          isEquipped
                            ? 'bg-indigo-500 text-white'
                            : 'border border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                        }`}
                      >
                        <span>{isEquipped ? 'Equipped' : 'Equip'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenPurchaseModal(item, 'outfit');
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
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                {statusTitle}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-800">
                {selectedItem ? selectedItem.name : emptyTitle}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {selectedItem
                  ? selectedItem.description
                  : emptyDescription}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3 text-right">
              {selectedItem ? (
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    {selectedEquipped
                      ? isBackgroundTab
                        ? 'Applied'
                        : 'Equipped'
                      : selectedOwned
                      ? 'Owned'
                      : `${selectedItem.price} Coins`}
                  </p>
                </div>
              ) : null}
              <button
                type="button"
                onClick={isBackgroundTab ? handleClearBackground : handleUnequipOutfit}
                disabled={
                  isBackgroundTab
                    ? !equippedBackground
                    : !equippedClothing || !ownedClothing.includes(equippedClothing)
                }
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  (isBackgroundTab
                    ? equippedBackground
                    : equippedClothing && ownedClothing.includes(equippedClothing))
                    ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                    : 'cursor-not-allowed border-slate-200 text-slate-300'
                }`}
              >
                {isBackgroundTab ? 'Reset Background' : 'Unequip Outfit'}
              </button>
            </div>
        </div>

          <div className="relative mx-auto flex h-[520px] -mt-5 my-auto w-full max-w-[520px] items-center justify-center">
            {/* Background Layer - show selected background or equipped background */}
            {overlayBackgroundItem?.imagePath ? (
              <div className="absolute inset-0 -z-10 overflow-hidden rounded-[40px] border border-slate-200/70 shadow-[0_40px_80px_rgba(63,61,86,0.18)]">
                {!previewBackgroundLoaded ? (
                  <div className="absolute inset-0 animate-pulse bg-slate-200/60" />
                ) : null}
                <Image
                  key={overlayBackgroundItem.id}
                  src={overlayBackgroundItem.imagePath}
                  alt={overlayBackgroundItem.name}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                  onLoadingComplete={() => setPreviewBackgroundLoaded(true)}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-white/25 backdrop-blur-[1px]" />
              </div>
            ) : (
              <div className="absolute inset-0 -z-10 rounded-[40px] border border-slate-200/70 bg-white shadow-[0_40px_80px_rgba(63,61,86,0.18)]" />
            )}
            {/* Show background preview when in backgrounds tab */}
            {isBackgroundTab && overlayBackgroundItem ? (
              <>
                <Image
                  key={overlayBackgroundItem.id}
                  src={overlayBackgroundItem.imagePath}
                  alt={overlayBackgroundItem.name}
                  fill
                  className="object-cover rounded-[40px]"
                  priority
                  unoptimized
                  onLoadingComplete={() => setPreviewBackgroundLoaded(true)}
                />
                {/* Show sperm character on top of background */}
                <div className="relative z-10 flex h-full w-full items-center justify-center">
                  <Image
                    src={activeBuddyState.asset}
                    alt={activeBuddyState.alt}
                    width={380}
                    height={380}
                    priority
                    className="animate-float object-contain drop-shadow-[0_25px_70px_rgba(0,0,0,0.5)]"
                  />
                </div>
              </>
            ) : (
              <div className="relative z-10 flex h-full w-full items-center justify-center px-6 py-8">
                <Image
                  src={overlayOutfit ? overlayOutfit.imagePath : activeBuddyState.asset}
                  alt={
                    overlayOutfit
                      ? `${overlayOutfit.name} preview`
                      : activeBuddyState.alt
                  }
                  width={520}
                  height={520}
                  priority
                  className="h-full w-full animate-float object-contain drop-shadow-[0_25px_70px_rgba(63,61,86,0.25)]"
                />
              </div>
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
        title={
          purchaseCandidate ? `Purchase ${purchaseCandidate.item.name}?` : ''
        }
        open={Boolean(purchaseCandidate)}
        onClose={handleClosePurchaseModal}
      >
        {purchaseCandidate ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100">
                <Image
                  src={purchaseCandidate.item.imagePath}
                  alt={purchaseCandidate.item.name}
                  width={56}
                  height={56}
                  className={`h-full w-full rounded-lg ${
                    purchaseCandidate.category === 'background' ? 'object-cover' : 'object-contain'
                  }`}
                  unoptimized={purchaseCandidate.category === 'background'}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {purchaseCandidate.item.name}
                </p>
                <p className="text-xs text-slate-500">
                  {purchaseCandidate.item.description}
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
              <span className="inline-flex items-center gap-2">
                <span>Cost:</span>
                {renderCoinValue(purchaseCandidate.item.price)}
              </span>
              <span className="mx-2 text-slate-400">·</span>
              <span className="inline-flex items-center gap-2">
                <span>Balance:</span>
                {renderCoinValue(coinsDisplay)}
              </span>
            </div>
            {coinsDisplay < purchaseCandidate.item.price ? (
              <p className="text-xs font-semibold text-rose-500">
                Need {purchaseCandidate.item.price - coinsDisplay} more coins to purchase this item.
              </p>
            ) : (
              <p className="text-xs text-emerald-600">
                {purchaseCandidate.category === 'background'
                  ? 'You have enough coins to unlock this background.'
                  : 'You have enough coins to unlock this outfit.'}
              </p>
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
                disabled={coinsDisplay < purchaseCandidate.item.price}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  coinsDisplay < purchaseCandidate.item.price
                    ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <span>Buy for</span>
                  {renderCoinValue(purchaseCandidate.item.price)}
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

      <StreakModal
        isOpen={showStreakModal}
        onClose={() => setShowStreakModal(false)}
        streakData={{
          currentStreak: sperm?.currentStreak || 0,
          longestStreak: sperm?.longestStreak || 0,
        }}
      />
    </>
  );
}
