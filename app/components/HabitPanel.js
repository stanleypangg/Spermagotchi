const HABIT_CARDS = [
  {
    key: 'exercise',
    title: 'Exercise 20–40 min',
    daily: '+2 MOT · +1 FLOW',
    weekly: '4+ days → +1 MOT',
  },
  {
    key: 'sleep',
    title: 'Sleep 7–9 h',
    daily: '+2 LIN',
    weekly: '5+ days → +1 LIN',
  },
  {
    key: 'hydration',
    title: 'Hydrate ≈2 L',
    daily: '+1 FLOW',
    weekly: '6+ days → +1 FLOW',
  },
  {
    key: 'noAlcohol',
    title: 'No alcohol today',
    daily: 'Stacks with consistency',
    weekly: '6+ days → +1 MOT & +1 LIN',
  },
  {
    key: 'noNicotine',
    title: 'No nicotine today',
    daily: 'Stacks with consistency',
    weekly: '6+ days → +1 to every stat',
  },
  {
    key: 'lCarnitine',
    title: 'L-carnitine dose',
    daily: '+1 MOT',
    weekly: '5+ days → +1 SIG',
  },
  {
    key: 'coq10',
    title: 'CoQ10 dose',
    daily: '+1 SIG',
    weekly: '5+ days → +1 MOT',
  },
  {
    key: 'micronutrients',
    title: 'Zinc / Selenium / Folate',
    daily: '+1 LIN',
    weekly: '5+ days → +1 FLOW',
  },
  {
    key: 'matchaOrPineapple',
    title: 'Matcha, tea or pineapple',
    daily: '+1 SIG',
    weekly: '',
  },
];

export default function HabitPanel({
  today,
  habitForm,
  onHabitChange,
  onSubmit,
  submitting,
}) {
  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <div className="flex items-baseline justify-between text-slate-700">
        <h3 className="text-xl font-bold text-[#3f3d56]">Daily Check-In</h3>
        <span className="text-sm font-semibold text-slate-500">{today}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {HABIT_CARDS.map((habit) => (
          <label
            key={habit.key}
            className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-indigo-100/80 bg-white px-4 py-4 text-left shadow-sm transition hover:border-indigo-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-[#3f3d56]">{habit.title}</p>
                <p className="text-xs font-medium text-slate-500">{habit.daily}</p>
                {habit.weekly ? (
                  <p className="text-xs font-semibold text-indigo-500">{habit.weekly}</p>
                ) : null}
              </div>
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0 accent-[#8f54ff]"
                checked={Boolean(habitForm[habit.key])}
                onChange={(event) => onHabitChange(habit.key, event.target.checked)}
              />
            </div>
          </label>
        ))}
      </div>

      <div className="rounded-2xl border border-indigo-100/70 bg-indigo-50/60 px-4 py-3 text-sm text-[#4f4c68]">
        Combo bonus: logging both <span className="font-semibold">Sleep</span> and{' '}
        <span className="font-semibold">Hydration</span> on the same day grants an extra{' '}
        <span className="font-semibold text-indigo-600">+1 LIN</span>.
      </div>

      <button
        className="inline-flex w-full items-center justify-center rounded-2xl bg-linear-to-r from-[#ff9ebb] via-[#8ec5ff] to-[#95f2ff] px-5 py-3 text-base font-extrabold text-white shadow-[0_12px_24px_rgba(143,173,255,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(143,173,255,0.3)] disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={submitting}
      >
        {submitting ? 'Saving…' : 'Save Check-In'}
      </button>
    </form>
  );
}

function ToggleRow({ label, value, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-100/80 bg-white px-4 py-3 font-semibold text-[#4f4c68] shadow-sm">
      <span>{label}</span>
      <input
        type="checkbox"
        className="h-5 w-5 accent-[#8f54ff]"
        checked={value}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function SliderRow({ label, suffix, min, max, step, value, onChange }) {
  return (
    <label className="flex flex-col gap-3 rounded-2xl border border-indigo-100/80 bg-white px-4 py-3 font-semibold text-[#4f4c68] shadow-sm">
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <span className="text-sm font-bold text-[#5a4b81]">
          {value}
          {suffix ? ` ${suffix}` : ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-[#8f54ff]"
      />
    </label>
  );
}

