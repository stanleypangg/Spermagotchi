'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePlayerData } from '@/app/hooks/usePlayerData';
import { getLeaderboardBots, insertPlayerIntoLeaderboard } from '@/app/data/leaderboardBots';
import { getPlayerTier } from '@/app/data/botGenerator';

export default function LeaderboardsPage() {
  const { playerData, loading: playerLoading } = usePlayerData();
  const [leaderboard, setLeaderboard] = useState([]);
  const [playerRank, setPlayerRank] = useState(null);
  const [showCount, setShowCount] = useState(50);

  useEffect(() => {
    const bots = getLeaderboardBots();
    const fullLeaderboard = playerData
      ? insertPlayerIntoLeaderboard(bots, playerData)
      : bots;

    setLeaderboard(fullLeaderboard);

    if (playerData) {
      const playerEntry = fullLeaderboard.find(entry => entry.isPlayer);
      setPlayerRank(playerEntry?.rank ?? null);
    }
  }, [playerData]);

  if (playerLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        <span className="text-sm font-medium">Loading leaderboard...</span>
      </main>
    );
  }

  const displayedLeaderboard = leaderboard.slice(0, showCount);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="rounded-3xl border-2 border-slate-200 bg-white p-8 text-center shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Global Rankings
          </p>
          <h1 className="mt-2 text-4xl font-bold text-slate-800">🏆 Leaderboard</h1>
          <p className="mt-3 text-sm text-slate-500">
            Compete with racers worldwide and climb to the top
          </p>

          {playerRank !== null && (
            <div className="mt-6 inline-flex items-center gap-3 rounded-full border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-3">
              <span className="text-2xl">🎯</span>
              <div className="text-left">
                <p className="text-xs font-semibold text-purple-600">Your Rank</p>
                <p className="text-2xl font-bold text-purple-700">#{playerRank}</p>
              </div>
              <div className="ml-2 h-8 w-px bg-purple-200" />
              <div className="text-left">
                <p className="text-xs font-semibold text-purple-600">Top</p>
                <p className="text-2xl font-bold text-purple-700">
                  {Math.round((playerRank / leaderboard.length) * 100)}%
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard Table */}
        <div className="overflow-hidden rounded-3xl border-2 border-slate-200 bg-white shadow-lg">
          {/* Table Header */}
          <div className="border-b-2 border-slate-200 bg-slate-50 px-6 py-4">
            <div className="grid grid-cols-12 gap-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              <div className="col-span-1">Rank</div>
              <div className="col-span-3">Player</div>
              <div className="col-span-2 text-center">ELO</div>
              <div className="col-span-2 text-center">Record</div>
              <div className="col-span-2 text-center">Win Rate</div>
              <div className="col-span-2 text-center">Tier</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-100">
            {displayedLeaderboard.map((entry, idx) => {
              const tier = getPlayerTier(entry.elo);
              const isPlayer = entry.isPlayer;
              const isTopThree = entry.rank <= 3;

              return (
                <div
                  key={`${entry.name}-${idx}`}
                  className={`grid grid-cols-12 gap-4 px-6 py-4 transition hover:bg-slate-50 ${
                    isPlayer ? 'bg-purple-50 border-l-4 border-purple-500 font-semibold' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="col-span-1 flex items-center">
                    {isTopThree ? (
                      <span className="text-2xl">
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                      </span>
                    ) : (
                      <span className="text-lg font-bold text-slate-600">
                        #{entry.rank}
                      </span>
                    )}
                  </div>

                  {/* Player Name */}
                  <div className="col-span-3 flex items-center">
                    <span className="text-sm font-semibold text-slate-800">
                      {entry.name}
                      {isPlayer && (
                        <span className="ml-2 rounded-full bg-purple-500 px-2 py-0.5 text-xs text-white">
                          YOU
                        </span>
                      )}
                    </span>
                  </div>

                  {/* ELO */}
                  <div className="col-span-2 flex items-center justify-center">
                    <span className="text-lg font-bold text-slate-800">{entry.elo}</span>
                  </div>

                  {/* Record */}
                  <div className="col-span-2 flex items-center justify-center">
                    <span className="text-sm text-slate-600">
                      <span className="font-semibold text-emerald-600">{entry.wins}</span>
                      {' - '}
                      <span className="font-semibold text-rose-600">{entry.losses}</span>
                    </span>
                  </div>

                  {/* Win Rate */}
                  <div className="col-span-2 flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-700">{entry.winRate}%</span>
                  </div>

                  {/* Tier */}
                  <div className="col-span-2 flex items-center justify-center">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-bold"
                      style={{
                        backgroundColor: `${tier.color}20`,
                        color: tier.color,
                      }}
                    >
                      {tier.icon} {tier.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Button */}
          {showCount < leaderboard.length && (
            <div className="border-t-2 border-slate-200 bg-slate-50 p-6 text-center">
              <button
                type="button"
                onClick={() => setShowCount(prev => Math.min(prev + 50, leaderboard.length))}
                className="rounded-full border-2 border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-600 transition hover:border-purple-200 hover:text-purple-600"
              >
                Load More
              </button>
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 shadow-md transition hover:border-purple-200 hover:text-purple-600"
          >
            <span>←</span>
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
