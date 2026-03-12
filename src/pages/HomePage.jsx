import { useMemo } from "react";
import { Link } from "react-router-dom";
import { modules } from "../data/phrasalVerbs";
import { useUser } from "../contexts/UserContext";
import { getGreeting } from "../utils/date";
import ProgressBar from "../components/ProgressBar";

export default function HomePage() {
  const { profile, moduleProgress, stats, streakReminderEnabled } = useUser();
  const greeting = useMemo(() => getGreeting(), []);

  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="glass-card overflow-hidden">
          <div className="bg-gradient-to-br from-brand-green via-[#7bdd2e] to-brand-blue p-6 text-white sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.35em] text-white/80">{greeting}</p>
            <h2 className="mt-3 text-balance text-4xl font-black sm:text-5xl">
              {profile?.username ? `Hola, ${profile.username}` : "Tu aventura en inglés sigue hoy"}
            </h2>
            <p className="mt-4 max-w-xl text-base font-semibold text-white/90">
              Mantén tu racha activa, suma puntos y domina nuevos phrasal verbs todos los días.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/modules" className="pill-button bg-white text-slate-900 hover:bg-slate-100">
                Ver módulos
              </Link>
              <Link to="/ranking" className="pill-button border border-white/40 text-white hover:bg-white/10">
                Ir al ranking
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="glass-card p-6">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Puntos totales</p>
            <p className="mt-3 text-4xl font-black text-slate-900 dark:text-white">
              {profile?.total_points ?? 0}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-300">
              +5 por verbo aprendido y hasta +50 por quiz perfecto.
            </p>
          </div>
          <div className="glass-card p-6">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Recordatorio</p>
            <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
              {streakReminderEnabled ? "Activo" : "Desactivado"}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-300">
              Puedes cambiarlo cuando quieras desde tu perfil.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-card p-5">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Racha actual</p>
          <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">🔥 {profile?.current_streak ?? 0}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Racha récord</p>
          <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{profile?.longest_streak ?? 0}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Módulos completos</p>
          <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{stats.completedModules}</p>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Tus módulos</p>
            <h3 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Aprende a tu ritmo</h3>
          </div>
          <Link to="/modules" className="text-sm font-black text-brand-blue">
            Ver todos
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {modules.map((module) => {
            const progress = moduleProgress[module.id] ?? { percentage: 0, learned: 0, total: module.phrases.length };

            return (
              <article key={module.id} className="glass-card p-5">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl text-white shadow-card"
                  style={{ backgroundColor: module.color }}
                >
                  {module.emoji}
                </div>
                <h4 className="mt-5 text-2xl font-black text-slate-900 dark:text-white">
                  Módulo {module.id} · {module.title}
                </h4>
                <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-300">
                  {module.description}
                </p>
                <div className="mt-5">
                  <ProgressBar value={progress.percentage} color={module.color} showLabel />
                </div>
                <p className="mt-3 text-sm font-bold text-slate-500 dark:text-slate-300">
                  {progress.learned}/{progress.total} verbos dominados
                </p>
                <Link
                  to={`/module/${module.id}`}
                  className="pill-button mt-5 w-full text-white hover:brightness-110"
                  style={{ backgroundColor: module.color }}
                >
                  Continuar lección
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
