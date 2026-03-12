import BadgeCard from "../components/BadgeCard";
import ProgressBar from "../components/ProgressBar";
import { BADGES } from "../data/badges";
import { modules } from "../data/phrasalVerbs";
import { useAuth } from "../contexts/AuthContext";
import { useUser } from "../contexts/UserContext";

export default function ProfilePage() {
  const { user, signOut, isGuestUser } = useAuth();
  const {
    profile,
    moduleProgress,
    stats,
    streakReminderEnabled,
    toggleStreakReminder,
    theme,
    toggleTheme,
  } = useUser();
  const initial = profile?.username?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-card p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-brand-green to-brand-blue text-3xl font-black text-white shadow-card">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="h-full w-full rounded-[28px] object-cover" />
              ) : (
                initial
              )}
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">{profile?.username ?? "Tu perfil"}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">{user?.email}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <div className="rounded-[24px] bg-slate-50 p-4 dark:bg-slate-800/70">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Recordatorio de racha</p>
                  <p className="mt-2 text-base font-bold text-slate-700 dark:text-slate-100">
                    {streakReminderEnabled ? "Activado" : "Desactivado"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleStreakReminder}
                  className={`pill-button ${streakReminderEnabled ? "bg-brand-green text-slate-950" : "bg-slate-900 text-white"}`}
                >
                  {streakReminderEnabled ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>

            <div className="rounded-[24px] bg-slate-50 p-4 dark:bg-slate-800/70">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Tema</p>
                  <p className="mt-2 text-base font-bold text-slate-700 dark:text-slate-100">
                    {theme === "light" ? "Claro" : "Oscuro"}
                  </p>
                </div>
                <button type="button" onClick={toggleTheme} className="pill-button bg-brand-blue text-white hover:brightness-110">
                  Cambiar tema
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={signOut}
              className="pill-button w-full bg-slate-900 py-3 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900"
            >
              {isGuestUser ? "Volver al inicio" : "Cerrar sesión"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["Puntos totales", profile?.total_points ?? 0],
            ["Racha actual", profile?.current_streak ?? 0],
            ["Racha más larga", profile?.longest_streak ?? 0],
            ["Módulos completados", stats.completedModules],
            ["Phrasal verbs aprendidos", stats.learnedCount],
            ["Quizzes completados", stats.quizzesCompleted],
            ["Quizzes perfectos", stats.perfectQuizzes],
            ["Repasos pendientes", stats.dueReviewCount],
          ].map(([label, value]) => (
            <div key={label} className="glass-card p-5">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">{label}</p>
              <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6 sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.35em] text-slate-400">Mis logros</p>
        <h3 className="mt-3 text-3xl font-black text-slate-900 dark:text-white">Insignias desbloqueables</h3>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {BADGES.map((badge) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              unlocked={stats.unlockedBadges.includes(badge.id)}
            />
          ))}
        </div>
      </div>

      <div className="glass-card p-6 sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.35em] text-slate-400">Progreso por módulo</p>
        <h3 className="mt-3 text-3xl font-black text-slate-900 dark:text-white">Tu mapa de avance</h3>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {modules.map((module) => {
            const progress = moduleProgress[module.id] ?? { learned: 0, total: module.phrases.length, percentage: 0 };

            return (
              <div key={module.id} className="rounded-[28px] bg-slate-50 p-5 dark:bg-slate-800/70">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl text-white shadow-card"
                    style={{ backgroundColor: module.color }}
                  >
                    {module.emoji}
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{module.title}</p>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">
                      {progress.learned}/{progress.total} aprendidos
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <ProgressBar value={progress.percentage} color={module.color} showLabel />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
