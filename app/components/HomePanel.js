export default function HomePanel({ latestCheckIn }) {
  return (
    <div className="flex h-full flex-col gap-4">
      <h3 className="text-xl font-bold text-[#3f3d56]">Hello, Caretaker!</h3>
      <p className="text-sm text-slate-500">
        Keep up daily habits to boost stats and prepare your buddy for future adventures.
      </p>
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

