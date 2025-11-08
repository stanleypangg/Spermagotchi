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
        <h3 className="text-xl font-bold text-[#3f3d56]">Daily Care</h3>
        <span className="text-sm font-semibold text-slate-500">{today}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ToggleRow
          label="Supplements"
          value={habitForm.tookSupplements}
          onChange={(value) => onHabitChange('tookSupplements', value)}
        />
        <SliderRow
          label="Exercise"
          suffix="min"
          min={0}
          max={120}
          step={5}
          value={habitForm.exerciseMinutes}
          onChange={(value) => onHabitChange('exerciseMinutes', value)}
        />
        <SliderRow
          label="Hydration"
          suffix="L"
          min={0}
          max={5}
          step={0.5}
          value={habitForm.drankWaterLiters}
          onChange={(value) => onHabitChange('drankWaterLiters', value)}
        />
        <SliderRow
          label="Sleep"
          suffix="hrs"
          min={0}
          max={12}
          step={0.5}
          value={habitForm.sleepHours}
          onChange={(value) => onHabitChange('sleepHours', value)}
        />
        <ToggleRow
          label="Pineapple Snack"
          value={habitForm.atePineapple}
          onChange={(value) => onHabitChange('atePineapple', value)}
        />
        <ToggleRow
          label="Matcha / Tea"
          value={habitForm.drankMatchaOrTea}
          onChange={(value) => onHabitChange('drankMatchaOrTea', value)}
        />
        <SliderRow
          label="Alcohol"
          suffix="drinks"
          min={0}
          max={8}
          step={1}
          value={habitForm.alcoholUnits}
          onChange={(value) => onHabitChange('alcoholUnits', value)}
        />
        <SliderRow
          label="Cigarettes"
          suffix=""
          min={0}
          max={20}
          step={1}
          value={habitForm.smokedCigarettes}
          onChange={(value) => onHabitChange('smokedCigarettes', value)}
        />
      </div>
      <button
        className="inline-flex w-full items-center justify-center rounded-2xl bg-linear-to-r from-[#ff9ebb] via-[#8ec5ff] to-[#95f2ff] px-5 py-3 text-base font-extrabold text-white shadow-[0_12px_24px_rgba(143,173,255,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(143,173,255,0.3)] disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={submitting}
      >
        {submitting ? 'Saving...' : 'Save Check-In'}
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

