'use client';

import { useState, useEffect } from 'react';
import { getPlayerTier } from '@/app/data/botGenerator';
import { TRACK_PRESETS } from '@/app/data/mockRace';

const STAT_DISPLAY_CONFIG = [
  { key: 'motility', label: 'Motility', abbr: 'MOT' },
  { key: 'linearity', label: 'Linearity', abbr: 'LIN' },
  { key: 'flow', label: 'Flow', abbr: 'FLOW' },
  { key: 'signals', label: 'Signals', abbr: 'SIG' },
];

export default function RaceMatchmaking({
  playerData,
  onRaceStart,
  selectedTrackData,
}) {
  const [phase, setPhase] = useState('idle'); // idle, matching, matched
  const [trackScrollIndex, setTrackScrollIndex] = useState(0);

  const elo = playerData?.elo ?? 1000;
  const tier = getPlayerTier(elo);
  const stats = playerData?.stats ?? { motility: 50, linearity: 50, flow: 50, signals: 50 };
  const raceHistory = playerData?.raceHistory ?? [];
  const wins = raceHistory.filter(r => r.place === 1).length;
  const losses = raceHistory.filter(r => r.place > 1).length;

  const handleFindRace = () => {
    setPhase('matching');
    
    // Animate track selection then show match found
    setTimeout(() => {
      setPhase('matched');
      
      // After showing match found for 1.5s, teleport to race
      setTimeout(() => {
        if (onRaceStart) {
          onRaceStart();
        }
      }, 1500);
    }, 2500);
  };

  useEffect(() => {
    if (phase === 'matching') {
      // Fast carousel animation
      const interval = setInterval(() => {
        setTrackScrollIndex(prev => (prev + 1) % TRACK_PRESETS.length);
      }, 80);

      // Slow down after 2 seconds
      const slowDown = setTimeout(() => {
        clearInterval(interval);
        const slowInterval = setInterval(() => {
          setTrackScrollIndex(prev => (prev + 1) % TRACK_PRESETS.length);
        }, 300);
        
        setTimeout(() => clearInterval(slowInterval), 400);
      }, 2000);

      return () => {
        clearInterval(interval);
        clearTimeout(slowDown);
      };
    }
  }, [phase]);

  if (phase === 'idle') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="w-full max-w-2xl space-y-6">
          {/* Player Stats Card */}
          <div className="rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-800">{playerData?.name ?? 'Player'}</h1>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-4xl">{tier.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Rank</p>
                    <p className="text-xl font-bold" style={{ color: tier.color }}>
                      {tier.name}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-500">ELO Rating</p>
                <p className="text-4xl font-bold text-slate-800">{elo}</p>
              </div>
            </div>

            {/* Win/Loss Record */}
            <div className="mb-6 flex gap-4 rounded-2xl bg-slate-50 p-4">
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-emerald-600">{wins}</p>
                <p className="text-xs font-semibold text-slate-500">WINS</p>
              </div>
              <div className="h-12 w-px bg-slate-300" />
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-rose-600">{losses}</p>
                <p className="text-xs font-semibold text-slate-500">LOSSES</p>
              </div>
              <div className="h-12 w-px bg-slate-300" />
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-slate-800">
                  {wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0}%
                </p>
                <p className="text-xs font-semibold text-slate-500">WIN RATE</p>
              </div>
            </div>

            {/* Stats Display */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Stats</p>
              {STAT_DISPLAY_CONFIG.map(stat => {
                const value = Math.round(stats[stat.key] ?? 50);
                return (
                  <div key={stat.key}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-semibold text-slate-600">{stat.label}</span>
                      <span className="font-bold text-slate-800">{value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Find Race Button */}
          <button
            type="button"
            onClick={handleFindRace}
            className="w-full rounded-3xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-6 text-2xl font-bold text-white shadow-xl transition hover:from-purple-600 hover:to-pink-600 hover:shadow-2xl active:scale-95"
          >
            <span className="drop-shadow-md">🏁 Find Race</span>
          </button>

          {/* Back Button */}
          <a
            href="/"
            className="block w-full rounded-3xl border-2 border-slate-200 bg-white px-8 py-4 text-center text-lg font-bold text-slate-600 shadow-md transition hover:bg-slate-50"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    );
  }

  if (phase === 'matching') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="w-full max-w-3xl space-y-6 text-center">
          <div className="animate-[fadeIn_0.3s_ease-out] rounded-3xl border-2 border-slate-200 bg-white p-12 shadow-2xl">
            <div className="mb-8">
              <div className="mx-auto mb-4 h-20 w-20 animate-spin rounded-full border-4 border-slate-200 border-t-purple-500" />
              <h2 className="animate-pulse text-4xl font-bold text-slate-800">Finding Opponents...</h2>
              <p className="mt-3 text-lg text-slate-500">Matching you with racers at your skill level</p>
            </div>

            {/* Animated Track Carousel */}
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-8 shadow-inner">
              <p className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
                🗺️ Selecting Track
              </p>
              <div className="flex items-center justify-center gap-3 overflow-x-auto pb-2">
                {TRACK_PRESETS.map((track, idx) => {
                  const isSelected = idx === trackScrollIndex % TRACK_PRESETS.length;
                  return (
                    <div
                      key={track.id}
                      className={`relative transform rounded-xl px-6 py-3 text-base font-bold transition-all duration-200 ${
                        isSelected
                          ? 'scale-125 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 text-white'
                          : 'scale-90 bg-white text-slate-400 opacity-60'
                      }`}
                      style={{
                        boxShadow: isSelected 
                          ? '0 0 30px rgba(168, 85, 247, 0.6), 0 0 60px rgba(236, 72, 153, 0.4), 0 10px 40px rgba(0, 0, 0, 0.3)'
                          : '0 4px 6px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      {isSelected && (
                        <>
                          {/* Animated glowing border */}
                          <div className="absolute inset-0 rounded-xl border-2 border-white/50 animate-pulse" />
                          {/* Shimmer effect */}
                          <div 
                            className="absolute inset-0 rounded-xl opacity-50"
                            style={{
                              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                              backgroundSize: '200% 100%',
                              animation: 'shimmer 1.5s infinite',
                            }}
                          />
                        </>
                      )}
                      <span className="relative z-10">{track.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'matched') {
    const selectedTrack = selectedTrackData || TRACK_PRESETS[trackScrollIndex % TRACK_PRESETS.length];
    
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-50 p-6">
        <div className="w-full max-w-4xl space-y-8">
          {/* Match Found Header with Animation */}
          <div className="animate-[bounceIn_0.6s_ease-out] rounded-3xl border-4 border-emerald-300 bg-gradient-to-r from-emerald-100 via-teal-100 to-emerald-100 p-10 text-center shadow-2xl">
            <div className="mb-3 text-6xl animate-bounce">🎉</div>
            <h2 className="text-5xl font-black text-emerald-700 drop-shadow-sm">
              MATCH FOUND!
            </h2>
            <p className="mt-3 text-xl font-semibold text-emerald-600">Preparing race...</p>
          </div>

          {/* Selected Track Display */}
          <div className="animate-[slideUp_0.5s_ease-out] rounded-3xl border-2 border-purple-200 bg-white p-10 text-center shadow-2xl">
            <p className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
              🗺️ Race Track
            </p>
            <div className="mb-6 flex items-center justify-center">
              <div className="transform animate-pulse rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 px-12 py-6 shadow-2xl shadow-purple-500/50">
                <h3 className="text-4xl font-black text-white drop-shadow-lg">
                  {selectedTrack.name}
                </h3>
              </div>
            </div>
            <p className="text-lg font-semibold text-slate-600">
              Track Width: {selectedTrack.width}m
            </p>
            <div className="mt-4 flex items-center justify-center gap-8 text-sm">
              {selectedTrack.zones.map((zone, idx) => (
                <div key={idx} className="text-center">
                  <div className={`mx-auto mb-1 h-3 w-12 rounded-full ${
                    zone.kind === 'flow' ? 'bg-blue-400' :
                    zone.kind === 'gradient' ? 'bg-pink-400' :
                    'bg-yellow-400'
                  }`} />
                  <p className="font-semibold capitalize text-slate-600">{zone.kind}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Teleporting Message */}
          <div className="animate-[fadeIn_1s_ease-out] text-center">
            <p className="text-2xl font-bold text-slate-700">
              ✨ Teleporting to race track...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

