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

// Bridge old sperm API to new player store
// spermId is now the player name
export async function GET(request, { params }) {
  try {
    const { spermId } = await params;
    const store = readStore();
    const playerData = store[spermId];
    
    if (!playerData) {
      return NextResponse.json({ error: 'Sperm not found.' }, { status: 404 });
    }
    
    // Return in old format for compatibility
    return NextResponse.json({
      sperm: {
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
      },
      derived: {
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
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
