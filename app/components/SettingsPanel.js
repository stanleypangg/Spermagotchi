export default function SettingsPanel({ loading, onReset }) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-indigo-100/80 bg-white/90 p-6 shadow-sm">
      <h3 className="text-xl font-bold text-[#3f3d56]">Buddy Settings</h3>
      <p className="text-sm text-slate-500">
        Want a fresh start? Hatch a new buddy and begin again.
      </p>
      <button
        className="inline-flex w-fit items-center justify-center rounded-2xl border border-pink-200/70 bg-pink-50 px-4 py-2 font-semibold text-[#ff4d8d] transition hover:bg-pink-100 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={onReset}
        disabled={loading}
      >
        {loading ? 'Working...' : 'Hatch New Buddy'}
      </button>
    </div>
  );
}

