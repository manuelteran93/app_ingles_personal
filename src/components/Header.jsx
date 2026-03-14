import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useUser } from "../contexts/UserContext";
import StreakBadge from "./StreakBadge";

const titles = {
  "/home": "Tu progreso",
  "/modules": "M\u00F3dulos",
  "/review": "Repaso diario",
  "/chat": "Chat con IA",
  "/stories": "Historias en ingles",
  "/writing": "Practica tu escritura",
  "/ranking": "Ranking social",
  "/profile": "Perfil",
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isGuestUser } = useAuth();
  const { profile, theme, toggleTheme } = useUser();
  const title = titles[location.pathname] ?? "Lecci\u00F3n";

  async function handleBackToStart() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.35em] text-slate-400">English Quest</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{title}</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-300">
          {profile?.username ?? user?.email ?? "Aprendiz"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-soft dark:bg-slate-900 dark:text-slate-100">
          {"\u2B50 "}{profile?.total_points ?? 0} pts
        </div>
        <StreakBadge value={profile?.current_streak ?? 0} />
        <button
          type="button"
          onClick={toggleTheme}
          className="pill-button bg-slate-900 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {theme === "light" ? "Modo oscuro" : "Modo claro"}
        </button>
        {isGuestUser ? (
          <button
            type="button"
            onClick={handleBackToStart}
            className="pill-button border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
          >
            Volver al inicio
          </button>
        ) : null}
      </div>
    </header>
  );
}