import { Link } from "react-router-dom";
import ProgressBar from "../components/ProgressBar";
import { useUser } from "../contexts/UserContext";
import { modules } from "../data/phrasalVerbs";

function SectionDivider({ badge, title, description }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <span className="rounded-full bg-brand-yellow/20 px-3 py-1 text-xs font-black uppercase tracking-[0.25em] text-brand-yellow">
          {badge}
        </span>
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>
      <div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">{description}</p>
      </div>
    </div>
  );
}

function ModuleGrid({ items, moduleProgress, labelBuilder }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {items.map((module, index) => {
        const progress = moduleProgress[module.id] ?? { learned: 0, total: module.phrases.length, percentage: 0 };
        const label = labelBuilder(module, index);

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

              <h4 className="mt-5 text-sm font-black uppercase tracking-[0.3em] text-slate-400">{label}</h4>
              <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{module.title}</p>
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
  const studyModules = sortedModules.filter((module) => !module.thematic && module.type !== "grammar" && module.type !== "vocabulary");
  const thematicModules = sortedModules.filter((module) => module.thematic === true);
  const grammarModules = sortedModules.filter((module) => module.type === "grammar");
  const vocabularyModules = sortedModules.filter((module) => module.type === "vocabulary");

  return (
    <section className="space-y-6">
      <div className="glass-card p-6 sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.35em] text-slate-400">Biblioteca de aprendizaje</p>
        <h2 className="mt-3 text-4xl font-black text-slate-900 dark:text-white">Elige tu siguiente reto</h2>
        <p className="mt-4 max-w-3xl text-base font-semibold text-slate-500 dark:text-slate-300">
          Cada modulo incluye 20 tarjetas con audio, ejemplos practicos y un quiz final de 10 preguntas aleatorias.
        </p>
      </div>

      <div className="space-y-6">
        <SectionDivider
          badge="Nivel"
          title="Por nivel"
          description="La ruta principal mantiene la progresion tradicional desde Basico hasta Examen B2."
        />
        <ModuleGrid
          items={studyModules}
          moduleProgress={moduleProgress}
          labelBuilder={(module, index) => `Modulo ${index + 1}`}
        />
      </div>

      <div className="space-y-6">
        <SectionDivider
          badge="Tema"
          title="Por tema"
          description="Practica vocabulario util agrupado por contextos reales del dia a dia."
        />
        <ModuleGrid
          items={thematicModules}
          moduleProgress={moduleProgress}
          labelBuilder={(module, index) => `Tematico ${index + 1}`}
        />
      </div>

      <div className="space-y-6">
        <SectionDivider
          badge="Gramatica"
          title={"Gramatica B2 \u{1F4DD}"}
          description="Refuerza estructuras clave del nivel B2 con formulas, ejemplos y uso practico."
        />
        <ModuleGrid
          items={grammarModules}
          moduleProgress={moduleProgress}
          labelBuilder={(module, index) => `Gramatica ${index + 1}`}
        />
      </div>

      <div className="space-y-6">
        <SectionDivider
          badge="Vocabulario"
          title={"Vocabulario B2 \u{1F4DA}"}
          description="Amplia tu registro academico y formal con conectores y palabras clave del nivel B2."
        />
        <ModuleGrid
          items={vocabularyModules}
          moduleProgress={moduleProgress}
          labelBuilder={(module, index) => `Vocabulario ${index + 1}`}
        />
      </div>
    </section>
  );
}