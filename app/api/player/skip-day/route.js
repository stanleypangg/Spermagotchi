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

function getTomorrowDateString(fromDate) {
  const date = new Date(fromDate);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
}

// POST /api/player/skip-day - Fast forward to tomorrow for demo
export async function POST(request) {
  try {
    const body = await request.json();
    const { name } = body;
    
    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }
    
    const store = readStore();
    const playerData = store[name];
    
    if (!playerData) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    
    const today = new Date().toISOString().split('T')[0];
    const lastCheckIn = playerData.lastCheckInDate || today;
    const tomorrow = getTomorrowDateString(lastCheckIn);
    
    // Apply passive decay (lose 2 motility, 2 linearity)
    const newStats = {
      motility: Math.max(0, (playerData.stats.motility || 50) - 2),
      linearity: Math.max(0, (playerData.stats.linearity || 50) - 2),
      flow: playerData.stats.flow || 50,
      signals: playerData.stats.signals || 50,
    };
    
    // Streak is broken if skipping a day without checking in
    const newStreak = 0;
    
    // Update player data
    store[name] = {
      ...playerData,
      stats: newStats,
      currentStreak: newStreak,
      lastCheckInDate: tomorrow,
      todayHabits: {}, // Clear habits for new day
    };
    
    writeStore(store);
    
    return NextResponse.json({
      player: store[name],
      message: `Skipped to ${tomorrow}. Streak reset. -2 Motility, -2 Linearity.`,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

