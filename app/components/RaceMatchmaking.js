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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-slate-50 p-6">
        <div className="w-full max-w-2xl space-y-6">
          {/* Player Stats Card - More Gamified */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-purple-200 bg-white p-8 shadow-2xl">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-purple-200/30 to-pink-200/30 blur-3xl" />
            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-gradient-to-tr from-pink-200/30 to-purple-200/30 blur-3xl" />
            
            <div className="relative z-10">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-black text-slate-800" style={{ fontFamily: 'Impact, fantasy' }}>
                    {playerData?.name ?? 'Player'}
                  </h1>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-full border-2 px-4 py-2 shadow-md" style={{ borderColor: tier.color, backgroundColor: `${tier.color}20` }}>
                      <span className="text-3xl">{tier.icon}</span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Rank</p>
                        <p className="text-2xl font-black" style={{ color: tier.color }}>
                          {tier.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 px-6 py-4 shadow-lg">
                    <p className="text-xs font-bold uppercase tracking-wider text-purple-600">ELO Rating</p>
                    <p className="text-5xl font-black text-purple-700">{elo}</p>
                  </div>
                </div>
              </div>

              {/* Win/Loss Record - Enhanced */}
              <div className="mb-6 grid grid-cols-3 gap-3">
                <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 text-center shadow-md">
                  <p className="text-3xl font-black text-emerald-600">{wins}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Wins</p>
                </div>
                <div className="rounded-xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-red-50 p-4 text-center shadow-md">
                  <p className="text-3xl font-black text-rose-600">{losses}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Losses</p>
                </div>
                <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4 text-center shadow-md">
                  <p className="text-3xl font-black text-purple-600">
                    {wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0}%
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Win Rate</p>
                </div>
              </div>

              {/* Stats Display - Compact */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Combat Stats</p>
                <div className="grid grid-cols-2 gap-3">
                  {STAT_DISPLAY_CONFIG.map(stat => {
                    const value = Math.round(stats[stat.key] ?? 50);
                    return (
                      <div key={stat.key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">{stat.label}</span>
                          <span className="text-lg font-black text-slate-800">{value}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Find Race Button - More Exciting */}
          <button
            type="button"
            onClick={handleFindRace}
            className="group relative w-full overflow-hidden rounded-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 px-8 py-8 shadow-2xl transition hover:shadow-purple-500/50 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" style={{
              animation: 'shimmer 2s infinite',
            }} />
            <span className="relative text-3xl font-black text-white drop-shadow-lg" style={{ fontFamily: 'Impact, fantasy' }}>
              🏁 FIND RACE
            </span>
          </button>

          {/* Back Button */}
          <a
            href="/"
            className="block w-full rounded-3xl border-2 border-slate-300 bg-white px-8 py-4 text-center text-base font-bold text-slate-600 shadow-md transition hover:border-purple-300 hover:bg-slate-50"
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

