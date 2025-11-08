'use client';

export default function StatMeter({ label, abbr, tooltip, value, color, description }) {
  return (
    <div
      className="flex flex-col gap-2 rounded-2xl border border-indigo-100/60 bg-white/80 p-4 shadow-sm"
      title={tooltip}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-3 font-semibold text-slate-700">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
            {abbr}
          </span>
          <span className="text-left">
            <span className="block text-base font-bold text-[#3f3d56]">{label}</span>
            <span className="block text-xs font-medium text-slate-500">{description}</span>
          </span>
        </span>
        <span className="text-lg font-bold text-[#5a4b81]">{value}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-indigo-100/60">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

