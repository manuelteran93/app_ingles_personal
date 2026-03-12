import confetti from "canvas-confetti";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import ProgressBar from "../components/ProgressBar";
import QuizQuestion from "../components/QuizQuestion";
import { getModuleById } from "../data/phrasalVerbs";
import { useUser } from "../contexts/UserContext";
import { createQuizQuestions } from "../utils/moduleHelpers";

const EXAM_TIME_LIMIT = 20;
const RING_RADIUS = 35;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function QuizModeCard({ icon, title, description, onClick, accentClass }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass-card group overflow-hidden text-left transition hover:-translate-y-1"
    >
      <div className={`h-2 w-full bg-gradient-to-r ${accentClass}`} />
      <div className="p-6 sm:p-7">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-3xl shadow-soft dark:bg-slate-800">
            {icon}
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">{description}</p>
          </div>
        </div>
      </div>
    </button>
  );
}

function ExamTimer({ timeLeft }) {
  const progress = timeLeft / EXAM_TIME_LIMIT;
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);
  const timerColor = timeLeft >= 11 ? "#58CC02" : timeLeft >= 6 ? "#FFC800" : "#FF4B4B";

  return (
    <div className={`absolute right-5 top-5 z-10 flex h-20 w-20 items-center justify-center ${timeLeft <= 5 ? "animate-pulse" : ""}`}>
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r={RING_RADIUS} stroke="rgba(148,163,184,0.2)" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={RING_RADIUS}
          stroke={timerColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-2xl font-black shadow-soft dark:bg-slate-950/90" style={{ color: timerColor }}>
        {timeLeft}
      </div>
    </div>
  );
}

export default function QuizPage() {
  const { id } = useParams();
  const module = useMemo(() => getModuleById(id), [id]);
  const { recordQuizResult } = useUser();
  const [mode, setMode] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState(EXAM_TIME_LIMIT);
  const [examBonusPoints, setExamBonusPoints] = useState(0);
  const [bonusFlash, setBonusFlash] = useState(null);
  const timeoutRef = useRef(null);
  const bonusTimeoutRef = useRef(null);

  useEffect(() => {
    if (!module) {
      return undefined;
    }

    setQuestions(createQuizQuestions(module.phrases, 10));
    setMode(null);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setRevealAnswer(false);
    setScore(0);
    setResult(null);
    setTimeLeft(EXAM_TIME_LIMIT);
    setExamBonusPoints(0);
    setBonusFlash(null);

    return undefined;
  }, [module]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      if (bonusTimeoutRef.current) {
        window.clearTimeout(bonusTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (mode !== "exam" || revealAnswer || !questions.length || result || saving) {
      return undefined;
    }

    if (timeLeft <= 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTimeLeft((current) => current - 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [mode, revealAnswer, questions.length, result, saving, timeLeft]);

  useEffect(() => {
    if (mode !== "exam" || revealAnswer || !questions.length || timeLeft > 0) {
      return;
    }

    setSelectedAnswer("__timeout__");
    setRevealAnswer(true);

    timeoutRef.current = window.setTimeout(() => {
      handleNext(true);
    }, 900);
  }, [mode, revealAnswer, questions.length, timeLeft]);

  if (!module) {
    return <Navigate to="/modules" replace />;
  }

  const currentQuestion = questions[currentIndex];
  const quizProgress = questions.length ? Math.round((currentIndex / questions.length) * 100) : 0;
  const isExamMode = mode === "exam";

  function resetQuestionState() {
    setSelectedAnswer(null);
    setRevealAnswer(false);
    setTimeLeft(EXAM_TIME_LIMIT);
    setBonusFlash(null);
  }

  function handleSelectMode(nextMode) {
    setMode(nextMode);
    setQuestions(createQuizQuestions(module.phrases, 10));
    setCurrentIndex(0);
    setScore(0);
    setResult(null);
    setExamBonusPoints(0);
    resetQuestionState();
  }

  function showBonusFlash(points) {
    if (!points) {
      return;
    }

    setBonusFlash(points);
    if (bonusTimeoutRef.current) {
      window.clearTimeout(bonusTimeoutRef.current);
    }
    bonusTimeoutRef.current = window.setTimeout(() => {
      setBonusFlash(null);
    }, 1400);
  }

  function handleAnswer(answer) {
    if (!currentQuestion || revealAnswer) {
      return;
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    setSelectedAnswer(answer);
    setRevealAnswer(true);

    if (answer === currentQuestion.correctAnswer) {
      setScore((current) => current + 1);

      if (isExamMode) {
        const secondsUsed = EXAM_TIME_LIMIT - timeLeft;
        const bonus = secondsUsed < 5 ? 3 : secondsUsed <= 10 ? 1 : 0;

        if (bonus > 0) {
          setExamBonusPoints((current) => current + bonus);
          showBonusFlash(bonus);
        }
      }
    }
  }

  async function handleNext(forceAdvance = false) {
    if (!revealAnswer && !forceAdvance) {
      return;
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    if (currentIndex === questions.length - 1) {
      setSaving(true);

      try {
        const finalScore = score;
        const savedResult = await recordQuizResult(module.id, finalScore, questions.length, {
          bonusPoints: isExamMode ? examBonusPoints : 0,
        });
        setResult({
          score: finalScore,
          total: questions.length,
          percentage: savedResult.percentage,
          points: savedResult.awardedPoints,
          bonusPoints: savedResult.bonusPoints ?? 0,
          mode,
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
    resetQuestionState();
  }

  function retryQuiz() {
    setQuestions(createQuizQuestions(module.phrases, 10));
    setCurrentIndex(0);
    setScore(0);
    setResult(null);
    setExamBonusPoints(0);
    resetQuestionState();
  }

  if (mode === null) {
    return (
      <section className="mx-auto max-w-5xl space-y-6">
        <div className="glass-card p-6 sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-slate-400">Selecciona tu desafío</p>
          <h2 className="mt-3 text-4xl font-black text-slate-900 dark:text-white">Quiz del módulo {module.id}</h2>
          <p className="mt-4 max-w-2xl text-base font-semibold text-slate-500 dark:text-slate-300">
            Elige si quieres practicar con calma o ponerte a prueba con un examen cronometrado.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <QuizModeCard
            icon="📚"
            title="Modo normal"
            description="Aprende a tu ritmo"
            accentClass="from-brand-green to-[#87E237]"
            onClick={() => handleSelectMode("normal")}
          />
          <QuizModeCard
            icon="⚡"
            title="Modo examen"
            description="20 segundos por pregunta"
            accentClass="from-brand-yellow to-[#FFD95A]"
            onClick={() => handleSelectMode("exam")}
          />
        </div>
      </section>
    );
  }

  if (result) {
    return (
      <section className="mx-auto max-w-3xl">
        <div className="glass-card overflow-hidden text-center">
          <div className="bg-gradient-to-br from-brand-blue via-brand-purple to-brand-yellow p-8 text-slate-950 sm:p-10">
            <p className="text-sm font-black uppercase tracking-[0.35em] text-slate-900/60">Resultados</p>
            <h2 className="mt-3 text-4xl font-black sm:text-5xl">{result.score}/{result.total} correctas</h2>
            <p className="mt-4 text-lg font-bold">Ganaste {result.points} puntos en este intento.</p>
            {result.mode === "exam" ? (
              <p className="mt-2 text-sm font-black uppercase tracking-[0.25em] text-slate-900/70">
                Bonus examen: +{result.bonusPoints}
              </p>
            ) : null}
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
              <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Modo</p>
              <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{result.mode === "exam" ? "⚡" : "📚"}</p>
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
          <div className="relative">
            {isExamMode ? <ExamTimer timeLeft={timeLeft} /> : null}
            {bonusFlash ? (
              <div className="absolute left-5 top-5 z-10 rounded-full bg-emerald-500 px-4 py-2 text-sm font-black text-white shadow-card animate-pulse">
                +{bonusFlash} bonus
              </div>
            ) : null}
            <QuizQuestion
              question={currentQuestion}
              selectedOption={selectedAnswer}
              revealAnswer={revealAnswer}
              onAnswer={handleAnswer}
              disabled={saving}
              explanation={currentQuestion.explanation}
            />
          </div>

          <div className="glass-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                {revealAnswer ? (
                  <p
                    className={`text-lg font-black ${
                      selectedAnswer === currentQuestion.correctAnswer
                        ? "text-emerald-600 dark:text-emerald-300"
                        : "text-rose-600 dark:text-rose-300"
                    }`}
                  >
                    {selectedAnswer === currentQuestion.correctAnswer
                      ? "¡Correcto!"
                      : `Respuesta correcta: ${currentQuestion.correctAnswer}`}
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">
                    {isExamMode
                      ? "Responde antes de que el tiempo llegue a cero."
                      : "Elige una opción para recibir feedback inmediato."}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleNext(false)}
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
