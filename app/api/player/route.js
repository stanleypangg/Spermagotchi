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

function getDefaultPlayerData(name) {
  return {
    name,
    stats: {
      motility: 50,
      linearity: 50,
      flow: 50,
      signals: 50,
    },
    elo: 1000,
    spermPoints: 250, // Starting coins
    raceHistory: [],
    currentStreak: 0,
    longestStreak: 0,
    lastCheckInDate: null,
    todayHabits: {}, // Today's habit selections
    ownedClothing: [],
    equippedClothing: null,
    ownedBackgrounds: [],
    equippedBackground: null,
    createdAt: new Date().toISOString(),
  };
}

// GET /api/player?name=username
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    
    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }
    
    const store = readStore();
    const playerData = store[name] || getDefaultPlayerData(name);
    
    // Auto-create if doesn't exist
    if (!store[name]) {
      store[name] = playerData;
      writeStore(store);
    }
    
    return NextResponse.json({ player: playerData });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/player - Update player data
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, data } = body;
    
    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }
    
    const store = readStore();
    
    // Merge with existing or create new
    store[name] = {
      ...getDefaultPlayerData(name),
      ...store[name],
      ...data,
      name, // Always keep the name
    };
    
    writeStore(store);
    
    return NextResponse.json({ player: store[name] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

