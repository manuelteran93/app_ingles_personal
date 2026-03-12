import confetti from "canvas-confetti";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import ProgressBar from "../components/ProgressBar";
import QuizQuestion from "../components/QuizQuestion";
import { getModuleById } from "../data/phrasalVerbs";
import { useUser } from "../contexts/UserContext";
import { createQuizQuestions } from "../utils/moduleHelpers";

export default function QuizPage() {
  const { id } = useParams();
  const module = useMemo(() => getModuleById(id), [id]);
  const { recordQuizResult } = useUser();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!module) {
      return;
    }

    setQuestions(createQuizQuestions(module.phrases, 10));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setRevealAnswer(false);
    setScore(0);
    setResult(null);
  }, [module]);

  if (!module) {
    return <Navigate to="/modules" replace />;
  }

  const currentQuestion = questions[currentIndex];
  const quizProgress = questions.length ? Math.round((currentIndex / questions.length) * 100) : 0;

  function handleAnswer(answer) {
    if (!currentQuestion || revealAnswer) {
      return;
    }

    setSelectedAnswer(answer);
    setRevealAnswer(true);

    if (answer === currentQuestion.correctAnswer) {
      setScore((current) => current + 1);
    }
  }

  async function handleNext() {
    if (!revealAnswer) {
      return;
    }

    if (currentIndex === questions.length - 1) {
      setSaving(true);

      try {
        const finalScore = score;
        const savedResult = await recordQuizResult(module.id, finalScore, questions.length);
        setResult({
          score: finalScore,
          total: questions.length,
          percentage: savedResult.percentage,
          points: savedResult.awardedPoints,
        });

        if (savedResult.percentage >= 70) {
          confetti({ particleCount: 180, spread: 90, origin: { y: 0.65 } });
        }
      } finally {
        setSaving(false);
      }

      return;
    }

    setCurrentIndex((current) => current + 1);
    setSelectedAnswer(null);
    setRevealAnswer(false);
  }

  function retryQuiz() {
    setQuestions(createQuizQuestions(module.phrases, 10));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setRevealAnswer(false);
    setScore(0);
    setResult(null);
  }

  if (result) {
    return (
      <section className="mx-auto max-w-3xl">
        <div className="glass-card overflow-hidden text-center">
          <div className="bg-gradient-to-br from-brand-blue via-brand-purple to-brand-yellow p-8 text-slate-950 sm:p-10">
            <p className="text-sm font-black uppercase tracking-[0.35em] text-slate-900/60">Resultados</p>
            <h2 className="mt-3 text-4xl font-black sm:text-5xl">{result.score}/{result.total} correctas</h2>
            <p className="mt-4 text-lg font-bold">Ganaste {result.points} puntos en este intento.</p>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
            <div className="rounded-[24px] bg-slate-50 p-4 dark:bg-slate-800/70">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Porcentaje</p>
              <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{result.percentage}%</p>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-4 dark:bg-slate-800/70">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Puntos</p>
              <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{result.points}</p>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-4 dark:bg-slate-800/70">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Módulo</p>
              <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{module.id}</p>
            </div>
          </div>
          <div className="grid gap-3 border-t border-slate-100 p-6 dark:border-slate-800 sm:grid-cols-3">
            <button
              type="button"
              onClick={retryQuiz}
              className="pill-button w-full bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-white"
            >
              Reintentar
            </button>
            <Link
              to={`/module/${module.id}`}
              className="pill-button w-full text-white hover:brightness-110"
              style={{ backgroundColor: module.color }}
            >
              Volver a lección
            </Link>
            <Link
              to="/ranking"
              className="pill-button w-full border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              Ver ranking
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
            <p className="text-sm font-black uppercase tracking-[0.35em] text-slate-400">Quiz del módulo {module.id}</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{module.title}</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-300">
              Pregunta {currentIndex + 1} de {questions.length || 10}
            </p>
          </div>
          <div className="min-w-[220px] flex-1 max-w-sm">
            <ProgressBar value={quizProgress} color={module.color} showLabel />
          </div>
        </div>
      </div>

      {currentQuestion ? (
        <>
          <QuizQuestion
            question={currentQuestion}
            selectedOption={selectedAnswer}
            revealAnswer={revealAnswer}
            onAnswer={handleAnswer}
            disabled={saving}
          />

          <div className="glass-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                {revealAnswer ? (
                  <p
                    className={`text-lg font-black ${
                      selectedAnswer === currentQuestion.correctAnswer ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"
                    }`}
                  >
                    {selectedAnswer === currentQuestion.correctAnswer
                      ? "¡Correcto!"
                      : `Respuesta correcta: ${currentQuestion.correctAnswer}`}
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">
                    Elige una opción para recibir feedback inmediato.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleNext}
                disabled={!revealAnswer || saving}
                className="pill-button bg-slate-900 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900"
              >
                {saving ? "Guardando..." : currentIndex === questions.length - 1 ? "Ver resultados" : "Siguiente"}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
