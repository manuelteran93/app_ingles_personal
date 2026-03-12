import confetti from "canvas-confetti";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PhraseCard from "../components/PhraseCard";
import { useUser } from "../contexts/UserContext";

function formatReviewDate(dateString) {
  if (!dateString) {
    return null;
  }

  return new Date(`${dateString}T00:00:00`).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
  });
}

export default function ReviewPage() {
  const { dueReviewItems, nextReviewDate, markPhraseStatus, loading, profile } = useUser();
  const [sessionItems, setSessionItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [completed, setCompleted] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (loading || !profile || initializedRef.current) {
      return;
    }

    setSessionItems(dueReviewItems);
    initializedRef.current = true;
  }, [dueReviewItems, loading]);

  const currentItem = sessionItems[currentIndex] ?? null;
  const nextReviewLabel = useMemo(() => formatReviewDate(nextReviewDate), [nextReviewDate]);

  async function handleAction(status) {
    if (!currentItem || busy) {
      return;
    }

    setBusy(true);

    try {
      const result = await markPhraseStatus(currentItem.moduleId, currentItem.phrase.id, status, {
        pointsOverride: 3,
      });
      setSessionPoints((current) => current + (result.awardedPoints ?? 0));

      if (currentIndex === sessionItems.length - 1) {
        setCompleted(true);
        confetti({ particleCount: 160, spread: 100, origin: { y: 0.68 } });
      } else {
        setCurrentIndex((current) => current + 1);
      }
    } finally {
      setBusy(false);
    }
  }

  if ((loading || !profile) && !initializedRef.current) {
    return (
      <section className="glass-card p-6 text-sm font-semibold text-slate-500 dark:text-slate-300">
        Preparando tu repaso diario...
      </section>
    );
  }

  if (completed && sessionItems.length) {
    return (
      <section className="mx-auto max-w-3xl">
        <div className="glass-card overflow-hidden text-center">
          <div className="bg-gradient-to-br from-brand-yellow via-brand-green to-brand-blue p-8 text-slate-950 sm:p-10">
            <p className="text-sm font-black uppercase tracking-[0.35em] text-slate-900/60">Repaso completado</p>
            <h2 className="mt-3 text-4xl font-black sm:text-5xl">¡Todo al día!</h2>
            <p className="mt-4 text-lg font-bold">
              Repasaste {sessionItems.length} phrasal verbs y sumaste {sessionPoints} puntos.
            </p>
          </div>
          <div className="grid gap-3 border-t border-slate-100 p-6 dark:border-slate-800 sm:grid-cols-2">
            <Link to="/home" className="pill-button w-full bg-slate-900 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900">
              Volver al inicio
            </Link>
            <Link to="/modules" className="pill-button w-full border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
              Seguir aprendiendo
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!sessionItems.length) {
    return (
      <section className="mx-auto max-w-3xl space-y-5">
        <div className="glass-card p-8 text-center sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-slate-400">Repaso diario</p>
          <h2 className="mt-3 text-4xl font-black text-slate-900 dark:text-white">¡Todo al día! Vuelve mañana 🎉</h2>
          <p className="mt-4 text-base font-semibold text-slate-500 dark:text-slate-300">
            {nextReviewLabel
              ? `Tu próximo repaso más cercano es el ${nextReviewLabel}.`
              : "Todavía no tienes repasos programados. Sigue estudiando para generar tu calendario SRS."}
          </p>
          <Link to="/modules" className="pill-button mt-6 bg-brand-blue text-white hover:brightness-110">
            Ir a módulos
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl space-y-5">
      <div className="glass-card p-5 sm:p-6">
        <p className="text-sm font-black uppercase tracking-[0.35em] text-slate-400">Repaso diario</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">{sessionItems.length} phrasal verbs para repasar hoy</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-300">
              Tarjeta {currentIndex + 1} de {sessionItems.length}
            </p>
          </div>
          <div className="rounded-full bg-brand-yellow px-4 py-2 text-sm font-black text-slate-900">
            +3 puntos por repaso completado
          </div>
        </div>
      </div>

      <PhraseCard
        phrase={currentItem.phrase}
        moduleColor={currentItem.moduleColor}
        progress={Math.round((currentIndex / sessionItems.length) * 100)}
        currentStatus={currentItem.status}
        onKnow={() => handleAction("learned")}
        onReview={() => handleAction("reviewing")}
        disabled={busy}
      />
    </section>
  );
}
