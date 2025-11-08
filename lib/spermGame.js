import { randomUUID } from 'crypto';

const sperms = new Map();
const habitCheckInsBySperm = new Map();

const STAT_KEYS = ['motility', 'linearity', 'flow', 'signals'];

const BASELINE_STATS = Object.freeze({
  motility: 50,
  linearity: 50,
  flow: 50,
  signals: 50,
});

const DAILY_POSITIVE_CAP = 4;
const WEEKLY_POSITIVE_CAP = 10;

const PASSIVE_DECAY_DELTA = Object.freeze({
  motilityDelta: -2,
  linearityDelta: -2,
  flowDelta: 0,
  signalsDelta: 0,
});

const HABIT_KEYS = Object.freeze([
  'exercise',
  'sleep',
  'hydration',
  'noAlcohol',
  'noNicotine',
  'lCarnitine',
  'coq10',
  'micronutrients',
  'matchaOrPineapple',
]);

const MILESTONE_THRESHOLDS = Object.freeze({
  exercise: 4,
  sleep: 5,
  hydration: 6,
  noAlcohol: 6,
  noNicotine: 6,
  lCarnitine: 5,
  coq10: 5,
  micronutrients: 5,
});

function createError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundToSingleDecimal(value) {
  return Math.round(value * 10) / 10;
}

function cloneStats(stats) {
  return STAT_KEYS.reduce((acc, key) => {
    acc[key] = stats[key];
    return acc;
  }, {});
}

function zeroDelta() {
  return {
    motilityDelta: 0,
    linearityDelta: 0,
    flowDelta: 0,
    signalsDelta: 0,
  };
}

function applyDeltaToStats(stats, delta) {
  const updated = {};
  for (const key of STAT_KEYS) {
    const prop = `${key}Delta`;
    updated[key] = clamp(stats[key] + (delta[prop] ?? 0), 0, 100);
  }
  return updated;
}

function parseDate(dateString) {
  const [year, month, day] = dateString.split('-').map((segment) => Number.parseInt(segment, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw createError(400, 'Invalid date provided.');
  }
  return date;
}

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(dateString, days) {
  const date = parseDate(dateString);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateString(date);
}

function differenceInDays(start, end) {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

function getTodayDateString() {
  const today = new Date();
  return toDateString(
    new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())),
  );
}

function getWeekKey(dateString) {
  const date = parseDate(dateString);
  const day = (date.getUTCDay() + 6) % 7; // Monday as start of week
  const start = new Date(date);
  start.setUTCDate(date.getUTCDate() - day);
  return toDateString(start);
}

function isEndOfWeek(dateString) {
  return parseDate(dateString).getUTCDay() === 0; // Sunday reset
}

function sanitizeHabits(rawHabits = {}) {
  return {
    exercise: Boolean(rawHabits.exercise),
    sleep: Boolean(rawHabits.sleep),
    hydration: Boolean(rawHabits.hydration),
    noAlcohol: Boolean(rawHabits.noAlcohol),
    noNicotine: Boolean(rawHabits.noNicotine),
    lCarnitine: Boolean(rawHabits.lCarnitine),
    coq10: Boolean(rawHabits.coq10),
    micronutrients: Boolean(rawHabits.micronutrients),
    matchaOrPineapple: Boolean(rawHabits.matchaOrPineapple),
  };
}

function computeStandardDeviation(values) {
  if (values.length === 0) {
    return 0;
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function calculateDerived(stats, historySnapshots) {
  const overallHealthScore = roundToSingleDecimal(
    0.35 * stats.motility +
      0.3 * stats.linearity +
      0.2 * stats.flow +
      0.15 * stats.signals,
  );

  const performanceRating = roundToSingleDecimal(
    0.45 * stats.motility + 0.35 * stats.linearity + 0.2 * stats.signals,
  );

  const window = historySnapshots.slice(-6);
  window.push({ stats });

  let consistencyScore;
  if (window.length >= 3) {
    const deviations = STAT_KEYS.map((key) =>
      computeStandardDeviation(window.map((snapshot) => snapshot.stats[key])),
    );
    const avgDeviation =
      deviations.reduce((sum, value) => sum + value, 0) / deviations.length;
    consistencyScore = roundToSingleDecimal(clamp(100 - avgDeviation * 10, 0, 100));
  } else {
    consistencyScore = roundToSingleDecimal(clamp(50 + overallHealthScore / 2, 0, 100));
  }

  return {
    overallHealthScore,
    consistencyScore,
    performanceRating,
  };
}

function createSnapshot(date, stats, statDelta, historySnapshots) {
  const derived = calculateDerived(stats, historySnapshots);
  return {
    date,
    stats: cloneStats(stats),
    statDelta: { ...statDelta },
    overallHealthScore: derived.overallHealthScore,
    consistencyScore: derived.consistencyScore,
    performanceRating: derived.performanceRating,
  };
}

function createWeekState() {
  return {
    statPositiveTotals: {
      motility: 0,
      linearity: 0,
      flow: 0,
      signals: 0,
    },
    successCounts: {
      exercise: 0,
      sleep: 0,
      hydration: 0,
      noAlcohol: 0,
      noNicotine: 0,
      lCarnitine: 0,
      coq10: 0,
      micronutrients: 0,
    },
    failureCounts: {
      alcohol: 0,
      nicotine: 0,
    },
    milestonesAwarded: {
      exercise: false,
      sleep: false,
      hydration: false,
      noAlcohol: false,
      noNicotine: false,
      lCarnitine: false,
      coq10: false,
      micronutrients: false,
    },
    penaltyApplied: false,
  };
}

function applyDailyWeeklyCaps(delta, weekState) {
  const working = { ...delta };

  const positiveSum = STAT_KEYS.reduce((sum, key) => {
    const value = working[`${key}Delta`] ?? 0;
    return sum + (value > 0 ? value : 0);
  }, 0);

  if (positiveSum > DAILY_POSITIVE_CAP) {
    const scale = DAILY_POSITIVE_CAP / positiveSum;
    for (const key of STAT_KEYS) {
      const prop = `${key}Delta`;
      const value = working[prop] ?? 0;
      if (value > 0) {
        working[prop] = value * scale;
      }
    }
  }

  for (const key of STAT_KEYS) {
    const prop = `${key}Delta`;
    const value = working[prop] ?? 0;
    if (value > 0) {
      const available = WEEKLY_POSITIVE_CAP - weekState.statPositiveTotals[key];
      if (available <= 0) {
        working[prop] = 0;
      } else if (value > available) {
        working[prop] = available;
      }
    }
  }

  return working;
}

function applyPassiveDecay(history, stats, lastDate, gapDays) {
  if (gapDays <= 0) {
    return { stats, lastDate };
  }

  let currentDate = lastDate;
  let workingStats = stats;

  for (let i = 0; i < gapDays; i += 1) {
    currentDate = addDays(currentDate, 1);
    workingStats = applyDeltaToStats(workingStats, PASSIVE_DECAY_DELTA);
    const snapshot = createSnapshot(
      currentDate,
      workingStats,
      PASSIVE_DECAY_DELTA,
      history,
    );
    history.push(snapshot);
  }

  return { stats: workingStats, lastDate: currentDate };
}

function processDailyHabits({ habits, weekState, date }) {
  const delta = zeroDelta();

  if (habits.exercise) {
    delta.motilityDelta += 2;
    delta.flowDelta += 1;
  }
  if (habits.sleep) {
    delta.linearityDelta += 2;
  }
  if (habits.hydration) {
    delta.flowDelta += 1;
  }
  if (habits.lCarnitine) {
    delta.motilityDelta += 1;
  }
  if (habits.coq10) {
    delta.signalsDelta += 1;
  }
  if (habits.micronutrients) {
    delta.linearityDelta += 1;
  }
  if (habits.matchaOrPineapple) {
    delta.signalsDelta += 1;
  }
  if (habits.sleep && habits.hydration) {
    delta.linearityDelta += 1;
  }

  const milestoneDelta = zeroDelta();
  const successCounts = weekState.successCounts;
  const milestonesAwarded = weekState.milestonesAwarded;

  const applyMilestone = (key, applyFn) => {
    if (!milestonesAwarded[key] && successCounts[key] >= MILESTONE_THRESHOLDS[key]) {
      milestonesAwarded[key] = true;
      applyFn();
    }
  };

  if (habits.exercise) {
    successCounts.exercise += 1;
    applyMilestone('exercise', () => {
      milestoneDelta.motilityDelta += 1;
    });
  }
  if (habits.sleep) {
    successCounts.sleep += 1;
    applyMilestone('sleep', () => {
      milestoneDelta.linearityDelta += 1;
    });
  }
  if (habits.hydration) {
    successCounts.hydration += 1;
    applyMilestone('hydration', () => {
      milestoneDelta.flowDelta += 1;
    });
  }
  if (habits.lCarnitine) {
    successCounts.lCarnitine += 1;
    applyMilestone('lCarnitine', () => {
      milestoneDelta.signalsDelta += 1;
    });
  }
  if (habits.coq10) {
    successCounts.coq10 += 1;
    applyMilestone('coq10', () => {
      milestoneDelta.motilityDelta += 1;
    });
  }
  if (habits.micronutrients) {
    successCounts.micronutrients += 1;
    applyMilestone('micronutrients', () => {
      milestoneDelta.flowDelta += 1;
    });
  }

  if (habits.noAlcohol) {
    successCounts.noAlcohol += 1;
    applyMilestone('noAlcohol', () => {
      milestoneDelta.motilityDelta += 1;
      milestoneDelta.linearityDelta += 1;
    });
  } else {
    weekState.failureCounts.alcohol += 1;
  }

  if (habits.noNicotine) {
    successCounts.noNicotine += 1;
    applyMilestone('noNicotine', () => {
      milestoneDelta.motilityDelta += 1;
      milestoneDelta.linearityDelta += 1;
      milestoneDelta.flowDelta += 1;
      milestoneDelta.signalsDelta += 1;
    });
  } else {
    weekState.failureCounts.nicotine += 1;
  }

  const combinedDelta = {
    motilityDelta: delta.motilityDelta + milestoneDelta.motilityDelta,
    linearityDelta: delta.linearityDelta + milestoneDelta.linearityDelta,
    flowDelta: delta.flowDelta + milestoneDelta.flowDelta,
    signalsDelta: delta.signalsDelta + milestoneDelta.signalsDelta,
  };

  let cappedDelta = applyDailyWeeklyCaps(combinedDelta, weekState);

  if (isEndOfWeek(date) && !weekState.penaltyApplied) {
    if (
      weekState.failureCounts.alcohol >= 3 ||
      weekState.failureCounts.nicotine >= 3
    ) {
      cappedDelta.linearityDelta -= 1;
    }
    weekState.penaltyApplied = true;
  }

  for (const key of STAT_KEYS) {
    const prop = `${key}Delta`;
    const value = cappedDelta[prop] ?? 0;
    if (value > 0) {
      weekState.statPositiveTotals[key] += value;
    }
  }

  return cappedDelta;
}

function ensureSpermExists(spermId) {
  const sperm = sperms.get(spermId);
  if (!sperm) {
    throw createError(404, 'Sperm not found.');
  }
  return sperm;
}

function createSperm(name) {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw createError(400, 'Name is required.');
  }

  const trimmedName = name.trim();
  const id = randomUUID();
  const now = new Date().toISOString();

  const sperm = {
    id,
    name: trimmedName,
    createdAt: now,
    currentDayIndex: 1,
    stats: cloneStats(BASELINE_STATS),
    history: [],
  };

  sperms.set(id, sperm);
  habitCheckInsBySperm.set(id, new Map());

  return cloneSperm(sperm);
}

function cloneSperm(sperm) {
  return {
    id: sperm.id,
    name: sperm.name,
    createdAt: sperm.createdAt,
    currentDayIndex: sperm.currentDayIndex,
    stats: cloneStats(sperm.stats),
    history: sperm.history.map((snapshot) => ({
      date: snapshot.date,
      stats: cloneStats(snapshot.stats),
      statDelta: { ...snapshot.statDelta },
      overallHealthScore: snapshot.overallHealthScore,
      consistencyScore: snapshot.consistencyScore,
      performanceRating: snapshot.performanceRating,
    })),
  };
}

function rebuildTimeline(sperm) {
  const checkIns = habitCheckInsBySperm.get(sperm.id) ?? new Map();
  const entries = Array.from(checkIns.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  const history = [];
  let workingStats = cloneStats(BASELINE_STATS);
  let lastDate = toDateString(new Date(sperm.createdAt));
  const weekStates = new Map();

  for (const checkIn of entries) {
    const distance = differenceInDays(lastDate, checkIn.date);
    if (distance > 0) {
      const passiveResult = applyPassiveDecay(history, workingStats, lastDate, distance - 1);
      workingStats = passiveResult.stats;
      lastDate = passiveResult.lastDate;
    }

    const weekKey = getWeekKey(checkIn.date);
    let weekState = weekStates.get(weekKey);
    if (!weekState) {
      weekState = createWeekState();
      weekStates.set(weekKey, weekState);
    }

    const statDelta = processDailyHabits({
      habits: checkIn.habits,
      weekState,
      date: checkIn.date,
    });

    workingStats = applyDeltaToStats(workingStats, statDelta);
    const snapshot = createSnapshot(checkIn.date, workingStats, statDelta, history);
    checkIn.statDelta = { ...statDelta };
    history.push(snapshot);
    lastDate = checkIn.date;
  }

  sperm.stats = cloneStats(workingStats);

  if (history.length > 0) {
    const createdDate = toDateString(new Date(sperm.createdAt));
    const latestDate = history[history.length - 1].date;
    sperm.currentDayIndex = differenceInDays(createdDate, latestDate) + 1;
  } else {
    sperm.currentDayIndex = 1;
  }

  sperm.history = history;
}

function submitHabitCheckIn(spermId, date, rawHabits) {
  const sperm = ensureSpermExists(spermId);

  if (!date || typeof date !== 'string') {
    throw createError(400, 'Date is required.');
  }

  const today = getTodayDateString();
  parseDate(date);
  if (date > today) {
    throw createError(400, 'Date cannot be in the future.');
  }

  const creationDate = toDateString(new Date(sperm.createdAt));
  if (date < creationDate) {
    throw createError(400, 'Date cannot be before the sperm was created.');
  }

  const sanitizedHabits = sanitizeHabits(rawHabits);

  const checkIns = habitCheckInsBySperm.get(spermId) ?? new Map();

  const existing = checkIns.get(date);
  const checkInRecord = {
    id: existing?.id ?? randomUUID(),
    spermId,
    date,
    submittedAt: new Date().toISOString(),
    habits: sanitizedHabits,
    statDelta: zeroDelta(),
  };

  checkIns.set(date, checkInRecord);
  habitCheckInsBySperm.set(spermId, checkIns);

  rebuildTimeline(sperm);

  const snapshot = sperm.history.find((entry) => entry.date === date);
  const derived = snapshot
    ? {
        overallHealthScore: snapshot.overallHealthScore,
        consistencyScore: snapshot.consistencyScore,
        performanceRating: snapshot.performanceRating,
      }
    : calculateDerived(sperm.stats, sperm.history);

  return {
    sperm: cloneSperm(sperm),
    delta: snapshot ? { ...snapshot.statDelta } : zeroDelta(),
    derived,
  };
}

function getSpermState(spermId, date) {
  const sperm = ensureSpermExists(spermId);
  const cloned = cloneSperm(sperm);

  if (date) {
    parseDate(date);
    const snapshot = cloned.history.find((entry) => entry.date === date);
    if (!snapshot) {
      return {
        sperm: cloned,
        derived: calculateDerived(cloned.stats, cloned.history),
      };
    }
    return {
      sperm: cloned,
      latestCheckIn: {
        date: snapshot.date,
        statDelta: { ...snapshot.statDelta },
      },
      derived: {
        overallHealthScore: snapshot.overallHealthScore,
        consistencyScore: snapshot.consistencyScore,
        performanceRating: snapshot.performanceRating,
      },
    };
  }

  const derived = calculateDerived(cloned.stats, cloned.history);

  return {
    sperm: cloned,
    latestCheckIn:
      cloned.history.length > 0
        ? {
            date: cloned.history[cloned.history.length - 1].date,
            statDelta: { ...cloned.history[cloned.history.length - 1].statDelta },
          }
        : undefined,
    derived,
  };
}

function getHistory(spermId, limit = 30) {
  const sperm = ensureSpermExists(spermId);
  const cappedLimit = clamp(Number.isFinite(limit) ? Math.round(limit) : 30, 1, 365);
  return sperm.history
    .slice(-cappedLimit)
    .map((snapshot) => ({
      date: snapshot.date,
      stats: cloneStats(snapshot.stats),
      statDelta: { ...snapshot.statDelta },
      overallHealthScore: snapshot.overallHealthScore,
      consistencyScore: snapshot.consistencyScore,
      performanceRating: snapshot.performanceRating,
    }));
}

export { createSperm, submitHabitCheckIn, getSpermState, getHistory };

