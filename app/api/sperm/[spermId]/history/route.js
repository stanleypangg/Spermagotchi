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

// Bridge old history API to new player store
export async function GET(request, { params }) {
  try {
    const { spermId } = await params;
    const store = readStore();
    const playerData = store[spermId];
    
    if (!playerData) {
      return NextResponse.json({ error: 'Sperm not found.' }, { status: 404 });
    }
    
    // Return empty history for now (can be expanded later)
    return NextResponse.json({ history: [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
