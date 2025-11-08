import { randomUUID } from 'crypto';

const sperms = new Map();
const habitCheckInsBySperm = new Map();

const BASELINE_STATS = Object.freeze({
  happiness: 50,
  vitality: 50,
  motility: 50,
  morphology: 50,
});

const DAILY_DELTA_CAP = 10;
const PASSIVE_DECAY_MAX_DAYS = 3;
const PASSIVE_DECAY_DELTA = Object.freeze({
  happinessDelta: -1,
  vitalityDelta: -1,
  motilityDelta: 0,
  morphologyDelta: 0,
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
  return {
    happiness: stats.happiness,
    vitality: stats.vitality,
    motility: stats.motility,
    morphology: stats.morphology,
  };
}

function zeroDelta() {
  return {
    happinessDelta: 0,
    vitalityDelta: 0,
    motilityDelta: 0,
    morphologyDelta: 0,
  };
}

function clampStats(stats) {
  return {
    happiness: clamp(stats.happiness, 0, 100),
    vitality: clamp(stats.vitality, 0, 100),
    motility: clamp(stats.motility, 0, 100),
    morphology: clamp(stats.morphology, 0, 100),
  };
}

function clampDailyDelta(delta) {
  return {
    happinessDelta: clamp(delta.happinessDelta, -DAILY_DELTA_CAP, DAILY_DELTA_CAP),
    vitalityDelta: clamp(delta.vitalityDelta, -DAILY_DELTA_CAP, DAILY_DELTA_CAP),
    motilityDelta: clamp(delta.motilityDelta, -DAILY_DELTA_CAP, DAILY_DELTA_CAP),
    morphologyDelta: clamp(delta.morphologyDelta, -DAILY_DELTA_CAP, DAILY_DELTA_CAP),
  };
}

function applyDeltaToStats(stats, delta) {
  const updated = {
    happiness: stats.happiness + delta.happinessDelta,
    vitality: stats.vitality + delta.vitalityDelta,
    motility: stats.motility + delta.motilityDelta,
    morphology: stats.morphology + delta.morphologyDelta,
  };
  return clampStats(updated);
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

function sanitizeHabits(rawHabits = {}) {
  const exerciseMinutesInput = Number(rawHabits.exerciseMinutes);
  const waterInput = Number(rawHabits.drankWaterLiters);
  const sleepInput = Number(rawHabits.sleepHours);
  const alcoholInput = Number(rawHabits.alcoholUnits);
  const cigarettesInput = Number(rawHabits.smokedCigarettes);

  const habits = {
    tookSupplements: Boolean(rawHabits.tookSupplements),
    exerciseMinutes: clamp(Number.isFinite(exerciseMinutesInput) ? Math.round(exerciseMinutesInput) : 0, 0, 180),
    drankWaterLiters: clamp(Number.isFinite(waterInput) ? waterInput : 0, 0, 5),
    sleepHours: clamp(Number.isFinite(sleepInput) ? sleepInput : 0, 0, 14),
    atePineapple: Boolean(rawHabits.atePineapple),
    drankMatchaOrTea: Boolean(rawHabits.drankMatchaOrTea),
    alcoholUnits: clamp(Number.isFinite(alcoholInput) ? Math.round(alcoholInput) : 0, 0, 10),
    smokedCigarettes: clamp(Number.isFinite(cigarettesInput) ? Math.round(cigarettesInput) : 0, 0, 30),
  };

  return habits;
}

function calculateHabitDelta(habits) {
  const delta = zeroDelta();

  if (habits.tookSupplements) {
    delta.happinessDelta += 1;
    delta.vitalityDelta += 4;
    delta.morphologyDelta += 2;
  }

  const exercise = habits.exerciseMinutes;
  if (exercise >= 60) {
    delta.happinessDelta += 2;
    delta.vitalityDelta += 6;
    delta.motilityDelta += 1;
  } else if (exercise >= 40) {
    delta.happinessDelta += 2;
    delta.vitalityDelta += 5;
  } else if (exercise >= 20) {
    delta.happinessDelta += 1;
    delta.vitalityDelta += 3;
  }

  const water = habits.drankWaterLiters;
  if (water >= 1.5) {
    delta.vitalityDelta += 2;
  }
  if (water >= 2.5) {
    delta.vitalityDelta += 1;
  }

  const sleep = habits.sleepHours;
  if (sleep < 6) {
    delta.vitalityDelta -= 2;
    delta.morphologyDelta -= 1;
  } else if (sleep < 7) {
    delta.vitalityDelta += 1;
  } else if (sleep <= 9) {
    delta.vitalityDelta += 4;
    delta.morphologyDelta += 2;
  } else if (sleep <= 10) {
    delta.vitalityDelta += 2;
    delta.morphologyDelta += 1;
  } else {
    delta.vitalityDelta += 1;
  }

  if (habits.atePineapple) {
    delta.happinessDelta += 1;
  }

  if (habits.drankMatchaOrTea) {
    delta.happinessDelta += 1;
  }

  const alcoholPenalty = Math.min(habits.alcoholUnits, 5);
  if (alcoholPenalty > 0) {
    delta.vitalityDelta -= alcoholPenalty;
    delta.morphologyDelta -= alcoholPenalty;
  }

  const cigarettes = habits.smokedCigarettes;
  if (cigarettes >= 1 && cigarettes <= 5) {
    delta.vitalityDelta -= 2;
    delta.morphologyDelta -= 1;
  } else if (cigarettes >= 6 && cigarettes <= 10) {
    delta.vitalityDelta -= 4;
    delta.morphologyDelta -= 3;
    delta.happinessDelta -= 1;
  } else if (cigarettes > 10) {
    delta.vitalityDelta -= 6;
    delta.morphologyDelta -= 4;
    delta.happinessDelta -= 2;
  }

  return delta;
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
    0.25 * stats.happiness +
      0.25 * stats.vitality +
      0.3 * stats.motility +
      0.2 * stats.morphology,
  );

  const performanceRating = roundToSingleDecimal(
    0.5 * stats.motility + 0.3 * stats.vitality + 0.2 * stats.morphology,
  );

  const window = historySnapshots.slice(-6);
  window.push({ stats });

  let consistencyScore;
  if (window.length >= 3) {
    const deviations = ['happiness', 'vitality', 'motility', 'morphology'].map(
      (key) => computeStandardDeviation(window.map((snapshot) => snapshot.stats[key])),
    );
    const avgDeviation =
      deviations.reduce((sum, value) => sum + value, 0) / deviations.length;
    consistencyScore = roundToSingleDecimal(
      clamp(100 - avgDeviation * 10, 0, 100),
    );
  } else {
    consistencyScore = roundToSingleDecimal(
      clamp(50 + overallHealthScore / 2, 0, 100),
    );
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

function applyPassiveDecay(history, stats, lastDate, gapDays) {
  if (gapDays <= 0) {
    return stats;
  }

  const passiveDays = Math.min(gapDays, PASSIVE_DECAY_MAX_DAYS);
  let currentDate = lastDate;
  let workingStats = stats;

  for (let i = 0; i < passiveDays; i += 1) {
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

  return workingStats;
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

  for (const checkIn of entries) {
    const distance = differenceInDays(lastDate, checkIn.date);
    const gapDays = distance > 0 ? distance - 1 : 0;
    if (gapDays > 0) {
      workingStats = applyPassiveDecay(history, workingStats, lastDate, gapDays);
      lastDate = addDays(lastDate, gapDays);
    }

    const delta = clampDailyDelta(calculateHabitDelta(checkIn.habits));
    workingStats = applyDeltaToStats(workingStats, delta);
    const snapshot = createSnapshot(checkIn.date, workingStats, delta, history);
    checkIn.statDelta = { ...delta };
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
  parseDate(date); // validate format
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

