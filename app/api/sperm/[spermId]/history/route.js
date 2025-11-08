import { NextResponse } from 'next/server';
import { getHistory } from '@/lib/spermGame';

function handleError(error) {
  const status = error?.status ?? 500;
  const message = error?.message ?? 'Internal server error';
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request, { params }) {
  try {
    const { spermId } = params;
    if (!spermId) {
      return NextResponse.json({ error: 'Missing spermId.' }, { status: 400 });
    }
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
    const history = getHistory(spermId, limit);
    return NextResponse.json({ history }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

