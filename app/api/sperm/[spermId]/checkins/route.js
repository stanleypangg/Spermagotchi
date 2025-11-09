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

// Bridge old sperm checkins API to new player store
// This endpoint ONLY saves habits, does NOT update streaks
// Streaks are only updated when a day passes (via skip-day endpoint)
export async function POST(request, { params }) {
  try {
    const { spermId } = await params;
    const body = await request.json();
    const { habits } = body;
    
    const store = readStore();
    const playerData = store[spermId];
    
    if (!playerData) {
      return NextResponse.json({ error: 'Sperm not found.' }, { status: 404 });
    }
    
    // Just process habits and update stats - NO streak changes
    // Stats can grow beyond 100 - no cap!
    const delta = processHabits(habits);
    
    const newStats = {
      motility: Math.max(0, playerData.stats.motility + delta.motility),
      linearity: Math.max(0, playerData.stats.linearity + delta.linearity),
      flow: Math.max(0, playerData.stats.flow + delta.flow),
      signals: Math.max(0, playerData.stats.signals + delta.signals),
    };
    
    // Update player data - keep streak/date unchanged
    store[spermId] = {
      ...playerData,
      stats: newStats,
      todayHabits: playerData.todayHabits || {}, // Keep today's habit selections
    };
    
    writeStore(store);
    
    return NextResponse.json({
      sperm: {
        id: spermId,
        name: playerData.name,
        stats: newStats,
        currentStreak: playerData.currentStreak || 0,
        longestStreak: playerData.longestStreak || 0,
        spermPoints: playerData.spermPoints || 0,
      },
      delta,
      streakBonus: 0,
      streakPoints: 0,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
