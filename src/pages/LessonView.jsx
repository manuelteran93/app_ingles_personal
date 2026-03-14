import confetti from "canvas-confetti";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import PhraseCard from "../components/PhraseCard";
import ProgressBar from "../components/ProgressBar";
import { getModuleById } from "../data/phrasalVerbs";
import { useUser } from "../contexts/UserContext";

export default function LessonView() {
  const { id } = useParams();
  const module = useMemo(() => getModuleById(id), [id]);
  const { userProgress, moduleProgress, markPhraseStatus } = useUser();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
    setSessionPoints(0);
    setCompleted(false);
  }, [id]);

  if (!module) {
    return <Navigate to="/modules" replace />;
  }

  const currentPhrase = module.phrases[currentIndex];
  const overallProgress = Math.round((currentIndex / module.phrases.length) * 100);
  const moduleState = moduleProgress[module.id] ?? { learned: 0, total: module.phrases.length, percentage: 0 };
  const currentStatus = userProgress.find(
    (entry) => entry.module_id === module.id && entry.phrase_id === currentPhrase?.id,
  )?.status;

  async function handleAction(status) {
    if (!currentPhrase || busy) {
      return;
    }

    setBusy(true);

    try {
      const result = await markPhraseStatus(module.id, currentPhrase.id, status);
      setSessionPoints((current) => current + (result.awardedPoints ?? 0));

      if (currentIndex === module.phrases.length - 1) {
        setCompleted(true);
        confetti({ particleCount: 180, spread: 100, origin: { y: 0.7 } });
      } else {
        setCurrentIndex((current) => current + 1);
      }
    } finally {
      setBusy(false);
    }
  }

  function restartLesson() {
    setCurrentIndex(0);
    setSessionPoints(0);
    setCompleted(false);
  }

  if (completed) {
    return (
      <section className="mx-auto max-w-3xl">
        <div className="glass-card overflow-hidden text-center">
          <div className="bg-gradient-to-br from-brand-green via-brand-yellow to-brand-blue p-8 text-slate-950 sm:p-10">
            <p className="text-sm font-black uppercase tracking-[0.35em] text-slate-900/60">Modulo completado</p>
            <h2 className="mt-3 text-4xl font-black sm:text-5xl">{"\u00A1Excelente trabajo!"}</h2>
            <p className="mt-4 text-lg font-bold">
              Sumaste {sessionPoints} puntos en esta sesion y avanzaste en {module.title}.
            </p>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
            <div className="rounded-[24px] bg-slate-50 p-4 dark:bg-slate-800/70">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Aprendidos</p>
              <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{moduleState.learned}</p>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-4 dark:bg-slate-800/70">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Progreso</p>
              <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{moduleState.percentage}%</p>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-4 dark:bg-slate-800/70">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Quiz final</p>
              <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">10 preguntas</p>
            </div>
          </div>
          <div className="grid gap-3 border-t border-slate-100 p-6 dark:border-slate-800 sm:grid-cols-3">
            <button
              type="button"
              onClick={restartLesson}
              className="pill-button w-full bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-white"
            >
              Repetir modulo
            </button>
            <Link
              to={`/module/${module.id}/quiz`}
              className="pill-button w-full text-white hover:brightness-110"
              style={{ backgroundColor: module.color }}
            >
              Hacer quiz
            </Link>
            <Link
              to="/home"
              className="pill-button w-full border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl space-y-5">
      <div className="glass-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.35em] text-slate-400">Modulo {module.id}</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
              {module.title} {module.emoji}
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-300">
              Tarjeta {currentIndex + 1} de {module.phrases.length}
            </p>
          </div>
          <div className="min-w-[220px] max-w-sm flex-1">
            <ProgressBar value={overallProgress} color={module.color} showLabel />
          </div>
        </div>
      </div>

      <PhraseCard
        phrase={currentPhrase}
        moduleColor={module.color}
        moduleType={module.type}
        progress={moduleState.percentage}
        currentStatus={currentStatus}
        onKnow={() => handleAction("learned")}
        onReview={() => handleAction("reviewing")}
        disabled={busy}
      />
    </section>
  );
}