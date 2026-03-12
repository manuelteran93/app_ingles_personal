import { NavLink } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

export default function BottomNav() {
  const { dueReviewItems } = useUser();
  const reviewCount = dueReviewItems.length;
  const items = [
    { to: "/home", label: "Home", icon: "\uD83C\uDFE0" },
    { to: "/modules", label: "M\u00F3dulos", icon: "\uD83D\uDCDA" },
    { to: "/review", label: "Repaso", icon: "\uD83D\uDD04", badge: reviewCount },
    { to: "/chat", label: "Chat", icon: "\uD83D\uDCAC" },
    { to: "/stories", label: "Historias", icon: "\uD83D\uDCD6" },
    { to: "/profile", label: "Perfil", icon: "\uD83D\uDC64" },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-3xl -translate-x-1/2 rounded-[28px] border border-white/70 bg-white/90 p-2 shadow-card backdrop-blur dark:border-white/10 dark:bg-slate-900/90">
      <ul className="grid grid-cols-6 gap-2">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center rounded-[20px] px-2 py-2 text-[11px] font-black transition sm:px-3 sm:text-xs ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-brand-green dark:text-slate-950"
                    : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span className="mt-1">{item.label}</span>
              {item.badge ? (
                <span className="absolute right-1.5 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white sm:right-2">
                  {item.badge}
                </span>
              ) : null}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}