'use client';

export default function NavigationBar({ items, activeTab, onSelect }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 flex w-full items-center justify-center border-t border-slate-200 bg-white/95 px-2 py-3 shadow-[0_-8px_32px_rgba(115,88,210,0.12)]">
      {items.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-xs font-semibold transition ${
              isActive ? 'text-[#5a4b81]' : 'text-[#8c87a6] hover:text-[#5a4b81]'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

