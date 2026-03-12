import { NavLink } from "react-router-dom";

const items = [
  { to: "/home", label: "Home", icon: "🏠" },
  { to: "/modules", label: "Módulos", icon: "📚" },
  { to: "/ranking", label: "Ranking", icon: "🏆" },
  { to: "/profile", label: "Perfil", icon: "👤" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 rounded-[28px] border border-white/70 bg-white/90 p-2 shadow-card backdrop-blur dark:border-white/10 dark:bg-slate-900/90">
      <ul className="grid grid-cols-4 gap-2">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center rounded-[20px] px-3 py-2 text-xs font-black transition ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-brand-green dark:text-slate-950"
                    : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span className="mt-1">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
