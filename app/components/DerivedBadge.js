export default function DerivedBadge({ label, value, accent }) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-1 rounded-2xl border bg-white px-3 py-4 text-center shadow-[0_12px_18px_rgba(173,216,230,0.2)]"
      style={{ borderColor: accent }}
    >
      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
        {label}
      </div>
      <div className="text-2xl font-bold text-slate-700">{value}</div>
    </div>
  );
}

