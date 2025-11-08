export default function DerivedBadge({ label, value, accent }) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-1 rounded-xl border px-3 py-4 text-center"
      style={{ borderColor: accent }}
    >
      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
        {label}
      </div>
      <div className="text-2xl font-bold text-slate-700">{value}</div>
    </div>
  );
}

