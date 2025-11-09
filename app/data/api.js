export async function fetchSpermState(id) {
  const res = await fetch(`/api/sperm/${id}/state`, { cache: 'no-store' });
  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    throw new Error('state-failed');
  }
  return res.json();
}

export async function fetchHistoryData(id, limit = 14) {
  const res = await fetch(
    `/api/sperm/${id}/history?limit=${encodeURIComponent(limit)}`,
    { cache: 'no-store' },
  );
  if (!res.ok) {
    throw new Error('history-failed');
  }
  return res.json();
}

export async function createRemoteSperm(name) {
  const res = await fetch('/api/sperm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error ?? 'Could not hatch buddy.');
  }
  return payload.sperm;
}

export async function submitHabitCheckIn({ spermId, habits }) {
  const res = await fetch(`/api/sperm/${spermId}/checkins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ habits }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error ?? 'Failed to submit habits.');
  }
}

