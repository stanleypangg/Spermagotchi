import Link from 'next/link';

export const metadata = {
  title: 'Leaderboards · Sperm Buddy',
};

export default function LeaderboardsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-6 py-16 text-center text-slate-600">
      <div className="max-w-md space-y-3 rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Leaderboards</p>
        <h1 className="text-3xl font-bold text-slate-800">Global rankings are on the way</h1>
        <p className="text-sm text-slate-500">
          Soon you&rsquo;ll be able to compare streaks, racing times, and wellness scores with other caretakers.
        </p>
        <p className="text-sm text-slate-500">
          Until then, keep stacking those habits and return here after the next update.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
      >
        Back to home
      </Link>
    </main>
  );
}

