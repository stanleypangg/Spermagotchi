import { NextResponse } from 'next/server';
import { submitHabitCheckIn } from '@/lib/spermGame';

function handleError(error) {
  const status = error?.status ?? 500;
  const message = error?.message ?? 'Internal server error';
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request, context) {
  try {
    const { spermId } = await context.params;
    const body = await request.json();
    if (!spermId) {
      return NextResponse.json({ error: 'Missing spermId.' }, { status: 400 });
    }
    const { habits } = body ?? {};
    const result = submitHabitCheckIn(spermId, habits);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

