'use client';

export default function StatMeter({ label, icon, value, color }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between font-semibold text-slate-700">
        <span className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          {label}
        </span>
        <span className="text-[#5a4b81]">{value}</span>
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

