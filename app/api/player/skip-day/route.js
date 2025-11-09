import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const STORE_PATH = path.join(process.cwd(), 'data', 'playerStore.json');

function readStore() {
  try {
    const data = fs.readFileSync(STORE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

function writeStore(data) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

function getTomorrowDateString() {
  const today = new Date();
  today.setDate(today.getDate() + 1);
  return today.toISOString().split('T')[0];
}

function processHabits(habits) {
  const delta = {
    motility: 0,
    linearity: 0,
    flow: 0,
    signals: 0,
  };

  // Good habits
  if (habits.drinkMatcha) {
    delta.signals += 1;
    delta.flow += 0.5;
  }
  if (habits.goon) {
    delta.motility += 1.2;
    delta.signals += 0.5;
  }
  if (habits.sleep8Hours) {
    delta.linearity += 1.5;
    delta.motility += 0.5;
  }
  if (habits.drink2LWater) {
    delta.flow += 1.2;
    delta.linearity += 0.3;
  }

  // Bad habits
  if (habits.drinkAlcohol) {
    delta.motility -= 1.5;
    delta.linearity -= 1;
    delta.signals -= 0.5;
  }
  if (habits.smokeCigarettes) {
    delta.motility -= 2;
    delta.signals -= 1;
  }
  if (habits.eatFastFood) {
    delta.motility -= 1;
    delta.flow -= 0.7;
  }
  if (habits.hotLaptop) {
    delta.motility -= 1.2;
    delta.flow -= 1;
  }

  return delta;
}

function getTodayDateString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function getYesterdayDateString() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

function hasAnyHabits(habits) {
  if (!habits) return false;
  return Object.values(habits).some(v => v === true);
}

// POST /api/player/skip-day - Simulate day passing and process check-in
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, habits } = body;
    
    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }
    
    const store = readStore();
    const playerData = store[name];
    
    if (!playerData) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    
    const tomorrow = getTomorrowDateString();
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();
    const lastCheckIn = playerData.lastCheckInDate;
    
    // Process current habits if provided
    const habitDelta = habits ? processHabits(habits) : { motility: 0, linearity: 0, flow: 0, signals: 0 };
    
    // Check if player completed ANY habits today
    const completedHabitsToday = hasAnyHabits(habits);
    
    // Calculate streak based on check-in consistency
    let currentStreak = playerData.currentStreak || 0;
    let longestStreak = playerData.longestStreak || 0;
    let streakBonus = 0;
    let streakPoints = 0;
    let streakMessage = '';
    
    if (!completedHabitsToday) {
      // No habits done = streak broken
      if (currentStreak > 0) {
        streakMessage = `💔 Streak broken! You had a ${currentStreak}-day streak.`;
      }
      currentStreak = 0;
    } else {
      // Habits completed - check streak continuation
      if (!lastCheckIn) {
        // First ever check-in
        currentStreak = 1;
        longestStreak = 1;
        streakMessage = '🎉 Started your first streak!';
      } else if (lastCheckIn === today || lastCheckIn === yesterday) {
        // Continuing streak (from today or yesterday)
        currentStreak += 1;
        longestStreak = Math.max(longestStreak, currentStreak);
        streakMessage = `🔥 ${currentStreak}-day streak!`;
      } else {
        // Streak was broken, starting fresh
        currentStreak = 1;
        longestStreak = Math.max(longestStreak, 1);
        streakMessage = '🌟 Started a new streak!';
      }
      
      // Streak bonuses based on milestones
      if (currentStreak >= 30) {
        streakBonus = 5;
        streakPoints = 100;
      } else if (currentStreak >= 14) {
        streakBonus = 3;
        streakPoints = 50;
      } else if (currentStreak >= 10) {
        streakBonus = 2;
        streakPoints = 30;
      } else if (currentStreak >= 7) {
        streakBonus = 2;
        streakPoints = 20;
      } else if (currentStreak >= 5) {
        streakBonus = 1;
        streakPoints = 10;
      } else if (currentStreak >= 3) {
        streakBonus = 1;
        streakPoints = 10;
      }
    }
    
    // Apply stat changes with streak bonus - NO CAP on stats!
    const newStats = {
      motility: Math.max(0, (playerData.stats.motility || 50) + habitDelta.motility + streakBonus),
      linearity: Math.max(0, (playerData.stats.linearity || 50) + habitDelta.linearity + streakBonus),
      flow: Math.max(0, (playerData.stats.flow || 50) + habitDelta.flow + streakBonus),
      signals: Math.max(0, (playerData.stats.signals || 50) + habitDelta.signals + streakBonus),
    };
    
    const newPoints = (playerData.spermPoints || 0) + streakPoints;
    
    // Update player data
    store[name] = {
      ...playerData,
      stats: newStats,
      currentStreak,
      longestStreak,
      lastCheckInDate: completedHabitsToday ? tomorrow : lastCheckIn, // Only update date if habits were done
      spermPoints: newPoints,
      todayHabits: {}, // Clear habits for new day
    };
    
    writeStore(store);
    
    let message = `⏭️ Advanced to tomorrow! ${streakMessage}`;
    if (streakBonus > 0) message += ` ✨ +${streakBonus} to all stats!`;
    if (streakPoints > 0) message += ` 💰 +${streakPoints} points!`;
    
    return NextResponse.json({
      player: store[name],
      message,
      streakBonus,
      streakPoints,
      completedHabitsToday,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

