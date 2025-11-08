export default function HomePanel({ latestCheckIn }) {
  return (
    <div className="flex h-full flex-col gap-4">
      <h3 className="text-xl font-bold text-[#3f3d56]">Hello, Caretaker!</h3>
      <ul className="grid gap-2 text-sm text-slate-500">
        <li className="flex items-start gap-2">
          <span className="mt-1 text-xs font-bold text-indigo-500">1</span>
          <span>Log quick daily check-ins to keep the loop moving.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1 text-xs font-bold text-indigo-500">2</span>
          <span>Your stats nudge forward with each good habit and streak.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1 text-xs font-bold text-indigo-500">3</span>
          <span>Consistency unlocks weekly boosts—misses shave MOT &amp; LIN.</span>
        </li>
      </ul>
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

