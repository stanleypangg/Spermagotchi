import { NextResponse } from 'next/server';
import { createSperm } from '@/lib/spermGame';

function handleError(error) {
  const status = error?.status ?? 500;
  const message = error?.message ?? 'Internal server error';
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const sperm = createSperm(body?.name);
    return NextResponse.json({ sperm }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

