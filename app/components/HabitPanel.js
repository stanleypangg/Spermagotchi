'use client';

import { useMemo, useState } from 'react';
import { BAD_HABITS_CONFIG, GOOD_HABITS_CONFIG } from '../data/constants';

const TABS = Object.freeze([
  { id: 'good', label: 'Good Habits', habits: GOOD_HABITS_CONFIG },
  { id: 'bad', label: 'Bad Habits', habits: BAD_HABITS_CONFIG },
]);

export default function HabitPanel({ habitForm, onToggle, submitting }) {
  const [activeTab, setActiveTab] = useState('good');
  const activeHabits = useMemo(() => {
    const tab = TABS.find((entry) => entry.id === activeTab);
    return tab?.habits ?? [];
  }, [activeTab]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex gap-2 rounded-full bg-slate-100 p-1 text-xs font-semibold text-slate-600">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-full px-3 py-2 transition ${
                isActive ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        className="flex flex-1 min-h-0 flex-col gap-1.5 overflow-y-auto pr-1"
        style={{ scrollbarGutter: 'stable both-edges' }}
      >
        {activeHabits.map((habit) => (
          <label
            key={habit.key}
            className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-slate-100"
          >
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-[#3f3d56]">{habit.title}</p>
              <p
                className={`text-xs font-medium ${
                  habit.category === 'bad' ? 'text-rose-500' : 'text-emerald-600'
                }`}
              >
                {habit.effect}
              </p>
            </div>
            <input
              type="checkbox"
              className="h-5 w-5 shrink-0 accent-[#8f54ff]"
              checked={Boolean(habitForm[habit.key])}
              onChange={(event) => onToggle(habit.key, event.target.checked)}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

