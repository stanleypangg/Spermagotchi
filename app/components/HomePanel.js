export default function HomePanel({ latestCheckIn }) {
  return (
    <div className="flex h-full flex-col gap-4">
      <h3 className="text-xl font-bold text-[#3f3d56]">Hello, Caretaker!</h3>
      <ul className="grid gap-2 text-sm text-slate-500">
        <li className="flex items-start gap-2">
          <span className="mt-1 text-xs font-bold text-indigo-500">1</span>
          <span>Select your daily habits to improve your stats.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1 text-xs font-bold text-indigo-500">2</span>
          <span>Use "Next Day" to advance time and lock in your check-in.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1 text-xs font-bold text-indigo-500">3</span>
          <span>Maintain daily streaks when days pass for bonus rewards!</span>
        </li>
      </ul>
      
      {/* Streak Rewards Info */}
      <div className="rounded-2xl border border-orange-100/80 bg-gradient-to-r from-orange-50/50 to-amber-50/50 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🔥</span>
          <span className="text-xs font-bold uppercase tracking-wider text-orange-600">Daily Streak Bonuses</span>
        </div>
        <div className="space-y-0.5 text-[11px] text-slate-600">
          <div className="flex justify-between">
            <span>3 days:</span>
            <span className="font-semibold text-orange-600">+1 stats, +10 pts</span>
          </div>
          <div className="flex justify-between">
            <span>7 days:</span>
            <span className="font-semibold text-orange-700">+2 stats, +20 pts</span>
          </div>
          <div className="flex justify-between">
            <span>14 days:</span>
            <span className="font-semibold text-purple-600">+3 stats, +50 pts</span>
          </div>
          <div className="flex justify-between">
            <span>30 days:</span>
            <span className="font-semibold text-yellow-600">+5 stats, +100 pts</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-2xl border border-indigo-100/80 bg-white px-4 py-3 font-semibold text-[#5a4b81] shadow-sm">
        {latestCheckIn ? (
          <>
            <span>Last cared for:</span>
            <strong className="text-[#3f3d56]">{latestCheckIn.date}</strong>
          </>
        ) : (
          <>
            <span>No care yet today.</span>
            <strong className="text-[#3f3d56]">Jump into Habits to get started!</strong>
          </>
        )}
      </div>
    </div>
  );
}

