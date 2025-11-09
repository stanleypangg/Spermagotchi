'use client';

export default function NavigationBar({ items, activeTab, onSelect }) {
  return (
    <nav className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex w-full -translate-x-1/2 justify-center px-6">
      <div className="pointer-events-auto flex w-full max-w-2xl items-center justify-between gap-3 rounded-full border border-slate-200/80 bg-white/80 px-6 py-3 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.45)] backdrop-blur-xl transition duration-300 supports-backdrop-filter:bg-white/55">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`group relative flex flex-1 min-w-[72px] flex-col items-center justify-center gap-1 overflow-hidden rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                isActive
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span
                className={`absolute inset-0 -z-10 rounded-full transition duration-300 ${
                  isActive
                    ? 'bg-linear-to-br from-slate-900 via-slate-900 to-slate-700 opacity-100 shadow-[0_10px_30px_rgba(15,23,42,0.35)]'
                    : 'bg-slate-900/5 opacity-0 group-hover:opacity-100'
                }`}
              />
              <span
                className={`absolute inset-x-4 -bottom-1 -z-20 h-1 rounded-full bg-slate-900/10 transition-all duration-300 ${
                  isActive ? 'opacity-0' : 'group-hover:opacity-100'
                }`}
              />
              <span
                className={`text-lg transition duration-300 ${
                  isActive ? 'scale-110' : 'group-hover:scale-110'
                }`}
              >
                {item.icon}
              </span>
              <span
                className={`leading-none transition-all duration-300 ${
                  isActive ? 'translate-y-0 opacity-100' : 'translate-y-px opacity-80'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

