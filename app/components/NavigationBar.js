'use client';

export default function NavigationBar({ items, activeTab, onSelect }) {
  return (
    <nav className="sticky bottom-0 mt-auto flex w-full max-w-3xl items-center justify-between self-center rounded-3xl border border-indigo-100/80 bg-white/90 px-4 py-3 shadow-[0_18px_40px_rgba(115,88,210,0.18)] backdrop-blur-md">
      {items.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-xs font-semibold transition ${
              isActive
                ? 'bg-linear-to-b from-pink-50 to-indigo-50 text-[#5a4b81]'
                : 'text-[#8c87a6] hover:text-[#5a4b81]'
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

