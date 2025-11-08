export default function HistoryPanel({ history, loading }) {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-[#3f3d56]">Recent Days</h3>
        {loading && <span className="text-sm text-slate-500">Loading…</span>}
      </div>
      {history.length === 0 ? (
        <p className="text-sm text-slate-500">
          No history yet. Log a check-in to see progress here.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {history
            .slice()
            .reverse()
            .map((entry) => (
              <li
                key={entry.date}
                className="flex flex-col gap-3 rounded-2xl border border-indigo-100/80 bg-white px-4 py-4 text-sm text-[#4f4c68] shadow-sm"
              >
                <div className="text-base font-bold text-[#3f3d56]">{entry.date}</div>
                <div className="flex flex-wrap gap-3 text-[#5a4b81]">
                  <span>😊 {entry.stats.happiness}</span>
                  <span>⚡ {entry.stats.vitality}</span>
                  <span>🏊 {entry.stats.motility}</span>
                  <span>🧬 {entry.stats.morphology}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-slate-500">
                  <span>Health {entry.overallHealthScore}</span>
                  <span>Perf {entry.performanceRating}</span>
                </div>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

