'use client';

import { useMemo, useState } from 'react';
import { BAD_HABITS_CONFIG, GOOD_HABITS_CONFIG } from '../data/constants';

const TABS = Object.freeze([
  { id: 'good', label: 'Good Habits', habits: GOOD_HABITS_CONFIG },
  { id: 'bad', label: 'Bad Habits', habits: BAD_HABITS_CONFIG },
]);

// Calculate total stat changes from selected habits
function calculateTotalDeltas(habitForm) {
  const deltas = { motility: 0, linearity: 0, flow: 0, signals: 0 };
  
  if (habitForm.drinkMatcha) {
    deltas.signals += 1;
    deltas.flow += 0.5;
  }
  if (habitForm.goon) {
    deltas.motility += 1.2;
    deltas.signals += 0.5;
  }
  if (habitForm.sleep8Hours) {
    deltas.linearity += 1.5;
    deltas.motility += 0.5;
  }
  if (habitForm.drink2LWater) {
    deltas.flow += 1.2;
    deltas.linearity += 0.3;
  }
  if (habitForm.drinkAlcohol) {
    deltas.motility -= 1.5;
    deltas.linearity -= 1;
    deltas.signals -= 0.5;
  }
  if (habitForm.smokeCigarettes) {
    deltas.motility -= 2;
    deltas.signals -= 1;
  }
  if (habitForm.eatFastFood) {
    deltas.motility -= 1;
    deltas.flow -= 0.7;
  }
  if (habitForm.hotLaptop) {
    deltas.motility -= 1.2;
    deltas.flow -= 1;
  }
  
  return deltas;
}

export default function HabitPanel({ habitForm, onToggle, submitting }) {
  const [activeTab, setActiveTab] = useState('good');
  const activeHabits = useMemo(() => {
    const tab = TABS.find((entry) => entry.id === activeTab);
    return tab?.habits ?? [];
  }, [activeTab]);
  
  const totalDeltas = useMemo(() => calculateTotalDeltas(habitForm || {}), [habitForm]);
  const hasAnyChanges = Object.values(totalDeltas).some(v => v !== 0);

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
      
      {/* Total Stat Changes Summary */}
      {hasAnyChanges && (
        <div className="rounded-xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 px-3 py-2.5 shadow-sm">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">📊 Total Effects</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {[
              { key: 'motility', label: 'MOT' },
              { key: 'linearity', label: 'LIN' },
              { key: 'flow', label: 'FLOW' },
              { key: 'signals', label: 'SIG' },
            ].map(stat => {
              const value = totalDeltas[stat.key];
              if (value === 0) return null;
              const isPositive = value > 0;
              return (
                <div key={stat.key} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">{stat.label}:</span>
                  <span className={`font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isPositive ? '+' : ''}{value.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

