'use client';

export default function NavigationBar({ items, activeTab, onSelect }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 flex w-full items-center justify-center border-t border-slate-200 bg-white/90 px-3 py-4 backdrop-blur-md transition duration-300">
      <div className="flex w-full max-w-xl items-center justify-between gap-2">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`group relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl px-3 py-2 text-xs font-semibold transition-all duration-300 ${
                isActive
                  ? 'text-white shadow-[0_-4px_24px_rgba(99,102,241,0.35)]'
                  : 'text-[#8c87a6] hover:text-white'
              }`}
            >
              <span
                className={`absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-400 to-purple-400 opacity-0 transition duration-300 group-hover:opacity-80 ${
                  isActive ? 'opacity-90' : ''
                }`}
              />
              <span
                className={`absolute inset-x-8 top-0 -z-20 h-[2px] origin-center scale-x-0 transform bg-gradient-to-r from-indigo-400 via-purple-300 to-transparent transition duration-300 group-hover:scale-x-100 ${
                  isActive ? 'scale-x-100' : ''
                }`}
              />
              <span className="text-lg transition duration-300 group-hover:scale-105">
                {item.icon}
              </span>
              <span
                className={`transition-all duration-300 ${
                  isActive ? 'translate-y-0 opacity-100' : 'translate-y-[2px] opacity-80'
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

