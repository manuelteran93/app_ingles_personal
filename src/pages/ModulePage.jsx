import { Link } from "react-router-dom";
import ProgressBar from "../components/ProgressBar";
import { useUser } from "../contexts/UserContext";
import { modules } from "../data/phrasalVerbs";

function SectionDivider({ title }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      <span className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">{title}</span>
      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

function ModuleGrid({ items, moduleProgress, thematic = false }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {items.map((module, index) => {
        const progress = moduleProgress[module.id] ?? { learned: 0, total: module.phrases.length, percentage: 0 };
        const label = thematic ? `Temático ${index + 1}` : `Módulo ${index + 1}`;

        return (
          <article key={module.id} className="glass-card overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl text-white shadow-card"
                  style={{ backgroundColor: module.color }}
                >
                  {module.emoji}
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black uppercase tracking-[0.25em] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  {progress.learned}/{progress.total}
                </span>
              </div>

              <h3 className="mt-5 text-3xl font-black text-slate-900 dark:text-white">{label}</h3>
              <p className="mt-2 text-lg font-bold text-slate-700 dark:text-slate-100">{module.title}</p>
              <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-300">{module.description}</p>
              <div className="mt-5">
                <ProgressBar value={progress.percentage} color={module.color} showLabel />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {module.phrases.slice(0, 5).map((phrase) => (
                  <span
                    key={phrase.id}
                    className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {phrase.phrase}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-3 border-t border-slate-100 p-5 dark:border-slate-800 sm:grid-cols-2">
              <Link
                to={`/module/${module.id}`}
                className="pill-button w-full bg-slate-900 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900"
              >
                Estudiar
              </Link>
              <Link
                to={`/module/${module.id}/quiz`}
                className="pill-button w-full border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
              >
                Ir al quiz
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default function ModulePage() {
  const { moduleProgress } = useUser();
  const sortedModules = [...modules].sort((a, b) => a.id - b.id);
  const normalModules = sortedModules.filter((module) => module.thematic !== true);
  const thematicModules = sortedModules.filter((module) => module.thematic === true);

  return (
    <section className="space-y-6">
      <div className="glass-card p-6 sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.35em] text-slate-400">Biblioteca de aprendizaje</p>
        <h2 className="mt-3 text-4xl font-black text-slate-900 dark:text-white">Elige tu siguiente reto</h2>
        <p className="mt-4 max-w-3xl text-base font-semibold text-slate-500 dark:text-slate-300">
          Cada módulo incluye 20 phrasal verbs, tarjetas con audio y un quiz final de 10 preguntas aleatorias.
        </p>
      </div>

      <div className="space-y-6">
        <SectionDivider title="Ruta principal" />
        <ModuleGrid items={normalModules} moduleProgress={moduleProgress} />
      </div>

      <div className="space-y-6">
        <SectionDivider title="Temáticos" />
        <ModuleGrid items={thematicModules} moduleProgress={moduleProgress} thematic />
      </div>
    </section>
  );
}
