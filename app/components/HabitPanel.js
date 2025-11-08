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
    weekly: '6+ days → +1 all stats',
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
    title: 'Zinc · Selenium · Folate',
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

export default function HabitPanel({ today, habitForm, onToggle, submitting }) {
  return (
    <div className="flex flex-col gap-3">
      {HABIT_CARDS.map((habit) => (
        <label
          key={habit.key}
          className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
        >
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-[#3f3d56]">{habit.title}</p>
            <p className="text-xs font-medium text-slate-500">{habit.daily}</p>
            {habit.weekly ? (
              <p className="text-[0.65rem] font-semibold text-indigo-500">{habit.weekly}</p>
            ) : null}
          </div>
          <input
            type="checkbox"
            className="h-5 w-5 shrink-0 accent-[#8f54ff]"
            checked={Boolean(habitForm[habit.key])}
            onChange={(event) => onToggle(habit.key, event.target.checked)}
          />
        </label>
      ))}

      <div className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs text-[#4f4c68]">
        Combo bonus: logging both <span className="font-semibold">Sleep</span> and{' '}
        <span className="font-semibold">Hydration</span> on the same day grants an extra{' '}
        <span className="font-semibold text-indigo-600">+1 LIN</span>.
      </div>

      {submitting && <div className="text-right text-xs font-semibold text-indigo-500">Saving…</div>}
    </div>
  );
}

