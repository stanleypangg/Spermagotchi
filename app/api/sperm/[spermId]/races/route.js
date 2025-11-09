import { NextResponse } from 'next/server';
import { submitRaceResult, getRaceHistory } from '@/lib/spermGame';

function handleError(error) {
  const status = error?.status ?? 500;
  const message = error?.message ?? 'Internal server error';
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request, { params }) {
  try {
    const { spermId } = await params;
    const body = await request.json();
    
    const result = submitRaceResult(spermId, body);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(request, { params }) {
  try {
    const { spermId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    
    const history = getRaceHistory(spermId, limit ? Number.parseInt(limit, 10) : 20);
    return NextResponse.json({ raceHistory: history }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

