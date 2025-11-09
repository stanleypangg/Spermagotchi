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

              {/* Stats Display - Compact with Ranks */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Combat Stats</p>
                <div className="grid grid-cols-2 gap-3">
                  {STAT_DISPLAY_CONFIG.map(stat => {
                    const value = Math.round(stats[stat.key] ?? 50);
                    
                    // Calculate stat rank - smart system that scales beyond 100
                    const getStatRank = (val) => {
                      if (val >= 300) return { rank: 'SSS+', color: 'from-yellow-400 to-orange-400' };
                      if (val >= 250) return { rank: 'SSS', color: 'from-purple-400 to-pink-400' };
                      if (val >= 200) return { rank: 'SS+', color: 'from-red-500 to-rose-500' };
                      if (val >= 150) return { rank: 'SS', color: 'from-red-400 to-rose-400' };
                      if (val >= 120) return { rank: 'S+', color: 'from-orange-500 to-amber-500' };
                      if (val >= 100) return { rank: 'S', color: 'from-orange-400 to-amber-400' };
                      if (val >= 85) return { rank: 'A+', color: 'from-emerald-500 to-teal-500' };
                      if (val >= 70) return { rank: 'A', color: 'from-emerald-400 to-teal-400' };
                      if (val >= 60) return { rank: 'B+', color: 'from-blue-500 to-cyan-500' };
                      if (val >= 50) return { rank: 'B', color: 'from-blue-400 to-cyan-400' };
                      if (val >= 40) return { rank: 'C+', color: 'from-slate-500 to-slate-600' };
                      return { rank: 'C', color: 'from-slate-400 to-slate-500' };
                    };
                    
                    const rankInfo = getStatRank(value);
                    
                    // Normalize stat for progress bar (0-100 scale for visual)
                    const normalizeForDisplay = (val) => {
                      // Soft cap visualization: 50→50%, 100→75%, 150→87%, 200→93%
                      return Math.min(100, 100 * (1 - Math.exp(-val / 100)));
                    };
                    
                    return (
                      <div key={stat.key} className="relative rounded-xl border border-slate-200 bg-slate-50 p-3">
                        {/* Rank Badge */}
                        <div className={`absolute -top-1.5 -right-1.5 rounded-full bg-gradient-to-r ${rankInfo.color} px-2 py-0.5 shadow-md`}>
                          <p className="text-[9px] font-black text-white">{rankInfo.rank}</p>
                        </div>
                        
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">{stat.label}</span>
                          <span className="text-lg font-black text-slate-800">{value}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                            style={{ width: `${normalizeForDisplay(value)}%` }}
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-slate-100 p-6">
        <div className="w-full max-w-4xl space-y-8 text-center">
          <div className="animate-[fadeIn_0.3s_ease-out] rounded-3xl border-2 border-purple-300 bg-white p-12 shadow-2xl">
            {/* Loading Animation */}
            <div className="mb-8">
              <div className="relative mx-auto mb-6 h-24 w-24">
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-purple-200 border-t-purple-500" />
                <div className="absolute inset-2 animate-spin rounded-full border-4 border-pink-200 border-t-pink-500" style={{ animationDuration: '1.5s' }} />
                <div className="absolute inset-4 animate-ping rounded-full bg-purple-500/20" />
              </div>
              <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 animate-pulse" style={{ fontFamily: 'Impact, fantasy' }}>
                FINDING OPPONENTS
              </h2>
              <p className="mt-3 text-xl font-semibold text-slate-600">Scanning for worthy challengers...</p>
            </div>

            {/* Animated Track Carousel - Enhanced */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 shadow-inner">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />
              <p className="relative z-10 mb-6 text-sm font-black uppercase tracking-widest text-yellow-400">
                🎰 Track Roulette
              </p>
              <div className="relative z-10 flex items-center justify-center gap-4 overflow-x-auto pb-2">
                {TRACK_PRESETS.map((track, idx) => {
                  const isSelected = idx === trackScrollIndex % TRACK_PRESETS.length;
                  return (
                    <div
                      key={track.id}
                      className={`relative transform rounded-2xl px-8 py-4 text-lg font-black transition-all duration-150 ${
                        isSelected
                          ? 'scale-125 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 text-white'
                          : 'scale-85 bg-slate-700 text-slate-400 opacity-40'
                      }`}
                      style={{
                        boxShadow: isSelected 
                          ? '0 0 40px rgba(251, 191, 36, 0.8), 0 0 80px rgba(249, 115, 22, 0.5), 0 0 120px rgba(236, 72, 153, 0.3), 0 15px 50px rgba(0, 0, 0, 0.4)'
                          : '0 4px 8px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      {isSelected && (
                        <>
                          {/* Triple animated border layers */}
                          <div className="absolute inset-0 rounded-2xl border-3 border-yellow-300 animate-pulse" />
                          <div className="absolute -inset-1 rounded-2xl border-2 border-orange-400/50 animate-ping" style={{ animationDuration: '1s' }} />
                          <div className="absolute -inset-2 rounded-2xl border border-pink-500/30 animate-ping" style={{ animationDuration: '1.5s' }} />
                          
                          {/* Shimmer sweep */}
                          <div 
                            className="absolute inset-0 rounded-2xl opacity-60"
                            style={{
                              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                              backgroundSize: '200% 100%',
                              animation: 'shimmer 1s infinite',
                            }}
                          />
                          
                          {/* Sparkles */}
                          <div className="absolute -top-1 -right-1 text-xl animate-pulse">✨</div>
                          <div className="absolute -top-1 -left-1 text-xl animate-pulse" style={{ animationDelay: '0.5s' }}>✨</div>
                        </>
                      )}
                      <span className="relative z-10 drop-shadow-lg">{track.name}</span>
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100 p-6">
        <div className="w-full max-w-4xl space-y-6">
          {/* Match Found Header - More Exciting */}
          <div className="relative animate-[bounceIn_0.6s_ease-out] overflow-hidden rounded-3xl border-4 border-emerald-400 bg-gradient-to-r from-emerald-200 via-teal-200 to-emerald-200 p-10 text-center shadow-2xl">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50" />
            <div className="relative z-10">
              <div className="mb-4 flex items-center justify-center gap-3">
                <span className="text-6xl animate-bounce">🎉</span>
                <span className="text-6xl animate-bounce" style={{ animationDelay: '0.1s' }}>🎊</span>
                <span className="text-6xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎉</span>
              </div>
              <h2 className="text-6xl font-black text-emerald-800 drop-shadow-lg" style={{ fontFamily: 'Impact, fantasy' }}>
                MATCH FOUND!
              </h2>
              <p className="mt-3 text-2xl font-bold text-emerald-700">Get ready to race!</p>
            </div>
          </div>

          {/* Selected Track Display - More Exciting */}
          <div className="animate-[slideUp_0.5s_ease-out] rounded-3xl border-2 border-purple-300 bg-white p-8 text-center shadow-2xl">
            <p className="mb-4 text-sm font-black uppercase tracking-widest text-slate-400">
              🏁 Selected Track
            </p>
            <div className="relative mb-6 flex items-center justify-center">
              {/* Glow rings */}
              <div className="absolute h-32 w-80 animate-pulse rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 blur-xl" />
              <div className="absolute h-24 w-72 animate-pulse rounded-full bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-purple-500/30 blur-lg" style={{ animationDelay: '0.5s' }} />
              
              <div className="relative transform rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 px-16 py-8 shadow-2xl shadow-purple-500/50">
                <h3 className="text-5xl font-black text-white drop-shadow-2xl" style={{ fontFamily: 'Impact, fantasy' }}>
                  {selectedTrack.name}
                </h3>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-center gap-6 text-sm">
              {selectedTrack.zones.map((zone, idx) => (
                <div key={idx} className="text-center">
                  <div className={`mx-auto mb-2 h-4 w-16 rounded-full shadow-lg ${
                    zone.kind === 'flow' ? 'bg-gradient-to-r from-blue-400 to-cyan-400' :
                    zone.kind === 'gradient' ? 'bg-gradient-to-r from-pink-400 to-rose-400' :
                    'bg-gradient-to-r from-yellow-400 to-orange-400'
                  }`} />
                  <p className="text-xs font-bold capitalize text-slate-700">{zone.kind}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Teleporting Message - More Dynamic */}
          <div className="animate-[fadeIn_0.8s_ease-out] text-center">
            <div className="inline-flex items-center gap-3 rounded-full border-2 border-purple-300 bg-white px-8 py-4 shadow-xl">
              <div className="flex gap-1">
                <span className="text-2xl animate-bounce">✨</span>
                <span className="text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>✨</span>
                <span className="text-2xl animate-bounce" style={{ animationDelay: '0.4s' }}>✨</span>
              </div>
              <p className="text-xl font-black text-slate-800">
                Teleporting to track...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

