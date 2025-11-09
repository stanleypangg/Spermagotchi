'use client';

export default function StreakModal({ isOpen, onClose, streakData }) {
  if (!isOpen) return null;

  const { currentStreak = 0, longestStreak = 0 } = streakData || {};
  
  // Fix logic: longestStreak should be at least currentStreak
  const displayLongest = Math.max(longestStreak, currentStreak);
  
  const rewards = [
    { day: 3, statBonus: 1, points: 10, icon: '🔥', color: 'orange' },
    { day: 7, statBonus: 2, points: 20, icon: '💪', color: 'red' },
    { day: 14, statBonus: 3, points: 50, icon: '🌟', color: 'purple' },
    { day: 30, statBonus: 5, points: 100, icon: '👑', color: 'yellow' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl animate-[scaleIn_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 px-6 py-5 text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white text-sm transition hover:bg-white/30"
          >
            ✕
          </button>
          <h2 className="text-3xl font-black text-white drop-shadow-lg">
            🔥 DAILY STREAK
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Current & Best Streak */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-1">Current</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl">🔥</span>
                <p className="text-5xl font-black text-orange-600">{currentStreak}</p>
              </div>
              <p className="text-sm font-semibold text-slate-600 mt-1">Days</p>
            </div>

            <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-1">Best</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl">👑</span>
                <p className="text-5xl font-black text-purple-600">{displayLongest}</p>
              </div>
              <p className="text-sm font-semibold text-slate-600 mt-1">Days</p>
            </div>
          </div>

          {/* Motivational Message */}
          <div className={`mb-5 rounded-xl border px-4 py-3 text-center ${
            currentStreak === 0
              ? 'bg-slate-50 border-slate-200'
              : currentStreak < 3
              ? 'bg-orange-50 border-orange-200'
              : currentStreak < 7
              ? 'bg-red-50 border-red-200'
              : 'bg-purple-50 border-purple-200'
          }`}>
            <p className={`text-sm font-bold ${
              currentStreak === 0 ? 'text-slate-600' : 
              currentStreak < 3 ? 'text-orange-700' :
              currentStreak < 7 ? 'text-red-700' : 'text-purple-700'
            }`}>
              {currentStreak === 0 
                ? "🌱 Check in daily to start your streak!"
                : currentStreak === 1
                ? "🔥 Day 1! Come back tomorrow to keep it alive!"
                : currentStreak === 2
                ? "💪 One more day to unlock your first reward!"
                : currentStreak < 7
                ? `⚡ ${7 - currentStreak} days until the next milestone!`
                : currentStreak < 14
                ? `🌟 ${14 - currentStreak} days to the 14-day reward!`
                : currentStreak < 30
                ? `👑 ${30 - currentStreak} days to LEGENDARY status!`
                : "🎉 You've reached the ultimate streak! Keep going!"}
            </p>
          </div>

          {/* Rewards Grid with Progress Lines */}
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Milestone Rewards
          </p>
          <div className="relative">
            {/* Progress Lines Container */}
            <div className="absolute top-12 left-0 right-0 flex items-center justify-between px-[15%]">
              {rewards.slice(0, -1).map((reward, idx) => {
                const nextReward = rewards[idx + 1];
                const lineStartDay = reward.day;
                const lineEndDay = nextReward.day;
                
                // Calculate progress percentage for this segment
                let progressPercent = 0;
                if (currentStreak >= lineEndDay) {
                  progressPercent = 100; // Fully completed
                } else if (currentStreak > lineStartDay) {
                  progressPercent = ((currentStreak - lineStartDay) / (lineEndDay - lineStartDay)) * 100;
                }
                
                return (
                  <div key={idx} className="flex-1 mx-2 h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                );
              })}
            </div>
            
            {/* Milestone Cards */}
            <div className="relative grid grid-cols-4 gap-3">
              {rewards.map((reward) => {
                const isAchieved = currentStreak >= reward.day;
                const isNext = !isAchieved && (rewards.find(r => currentStreak < r.day)?.day === reward.day);
                
                return (
                  <div
                    key={reward.day}
                    className={`relative rounded-xl border-2 p-4 text-center transition ${
                      isAchieved
                        ? 'border-emerald-400 bg-gradient-to-br from-emerald-100 to-teal-100 shadow-md'
                        : isNext
                        ? 'border-orange-300 bg-orange-50 shadow-sm'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    {isNext && (
                      <div className="absolute -top-2 -right-2 rounded-full bg-orange-500 px-2 py-0.5 text-[9px] font-black text-white shadow-md">
                        NEXT
                      </div>
                    )}
                    {isAchieved && (
                      <div className="absolute -top-2 -right-2 rounded-full bg-emerald-500 p-1 shadow-md">
                        <span className="text-xs text-white">✓</span>
                      </div>
                    )}
                    <div className="mb-2 text-3xl">{reward.icon}</div>
                    <div className="text-xs font-black text-slate-800 mb-2">Day {reward.day}</div>
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-emerald-600">+{reward.statBonus} Stats</div>
                      <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-purple-600">
                        <img src="https://cdn-icons-png.flaticon.com/512/7672/7672104.png" alt="" className="h-3 w-3" />
                        <span>{reward.points}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Text */}
          <div className="mt-5 rounded-xl bg-slate-100 px-4 py-2.5 text-center">
            <p className="text-xs font-semibold text-slate-600">
              💡 Check in habits daily to maintain your streak!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

