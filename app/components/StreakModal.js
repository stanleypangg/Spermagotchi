'use client';

export default function StreakModal({ isOpen, onClose, streakData }) {
  if (!isOpen) return null;

  const { currentStreak = 0, longestStreak = 0 } = streakData || {};
  
  const rewards = [
    { day: 1, statBonus: 0, points: 0, icon: '📅' },
    { day: 3, statBonus: 1, points: 10, icon: '🔥' },
    { day: 5, statBonus: 1, points: 10, icon: '🔥' },
    { day: 7, statBonus: 2, points: 20, icon: '💪' },
    { day: 10, statBonus: 2, points: 30, icon: '⚡' },
    { day: 14, statBonus: 3, points: 50, icon: '🌟' },
    { day: 30, statBonus: 5, points: 100, icon: '👑' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="relative w-full max-w-2xl rounded-3xl bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 p-1 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-3xl bg-white">
          {/* Header */}
          <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 px-8 py-6 text-center">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
            >
              ✕
            </button>
            <h2 className="text-4xl font-black text-white drop-shadow-lg" style={{ fontFamily: 'Impact, fantasy' }}>
              DAILY STREAK
            </h2>
          </div>

          {/* Current Streak Display */}
          <div className="px-8 py-6">
            <div className="mb-6 flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <span className="text-4xl">🔥</span>
                  <div className="text-left">
                    <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">Current</p>
                    <p className="text-5xl font-black text-orange-600">{currentStreak}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-600">Day Streak</p>
              </div>

              <div className="h-16 w-px bg-slate-300" />

              <div className="text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <span className="text-4xl">👑</span>
                  <div className="text-left">
                    <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">Best</p>
                    <p className="text-5xl font-black text-purple-600">{longestStreak}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-600">All Time</p>
              </div>
            </div>

            {/* Motivational Message */}
            <div className="mb-6 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-orange-200 px-6 py-4 text-center">
              <p className="text-sm font-bold text-orange-700">
                {currentStreak === 0 
                  ? "🌱 Start your streak journey today!"
                  : currentStreak < 3
                  ? "🔥 Keep it up! Reach 3 days for your first bonus!"
                  : currentStreak < 7
                  ? "💪 Excellent! Hit 7 days for an even bigger reward!"
                  : "⭐ You're on fire! Keep that consistency going!"}
              </p>
            </div>

            {/* Rewards Grid */}
            <p className="mb-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
              Streak Rewards
            </p>
            <div className="grid grid-cols-7 gap-2">
              {rewards.map((reward) => {
                const isAchieved = currentStreak >= reward.day;
                const isCurrent = currentStreak === reward.day;
                
                return (
                  <div
                    key={reward.day}
                    className={`relative rounded-xl border-2 p-3 text-center transition ${
                      isCurrent
                        ? 'border-orange-400 bg-gradient-to-br from-orange-100 to-amber-100 shadow-lg scale-110'
                        : isAchieved
                        ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    {isCurrent && (
                      <div className="absolute -top-2 -right-2 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
                        TODAY
                      </div>
                    )}
                    <div className="mb-1 text-2xl">{reward.icon}</div>
                    <div className="text-xs font-black text-slate-700">Day {reward.day}</div>
                    {reward.statBonus > 0 && (
                      <div className="mt-1 text-[10px] font-bold text-emerald-600">+{reward.statBonus} Stats</div>
                    )}
                    {reward.points > 0 && (
                      <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] font-bold text-purple-600">
                        <img src="https://cdn-icons-png.flaticon.com/512/7672/7672104.png" alt="" className="h-2.5 w-2.5" />
                        <span>{reward.points}</span>
                      </div>
                    )}
                    {isAchieved && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-emerald-500/20">
                        <span className="text-3xl">✓</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Info Text */}
            <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-center">
              <p className="text-xs text-slate-600">
                💡 Check in daily to maintain your streak and earn rewards!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

