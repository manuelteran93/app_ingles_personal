import confetti from "canvas-confetti";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AudioButton from "../components/AudioButton";
import { useUser } from "../contexts/UserContext";

const WRITING_MODULE_ID_BASE = 2000;
const WRITING_SYSTEM_PROMPT = `Eres un profesor de ingles experto en preparacion B2 para hispanohablantes. El estudiante te enviara un texto en ingles y debes analizarlo y corregirlo. Responde SIEMPRE en espanol con este formato JSON exacto (sin markdown, sin backticks):
{
  "overallScore": 75,
  "level": "B1+",
  "correctedText": "El texto completo corregido en ingles",
  "summary": "Resumen breve en espanol de la evaluacion general (2-3 oraciones)",
  "strengths": ["Punto positivo 1", "Punto positivo 2"],
  "errors": [
    {
      "original": "texto incorrecto del estudiante",
      "corrected": "version correcta",
      "explanation": "explicacion en espanol de por que esta mal y la regla"
    }
  ],
  "suggestions": ["Sugerencia de mejora 1", "Sugerencia de mejora 2"],
  "phrasalVerbsUsed": ["phrasal verb detectado 1", "phrasal verb detectado 2"],
  "connectorsUsed": ["conector detectado"],
  "nextStep": "Que deberia practicar este estudiante a continuacion"
}
Se constructivo y motivador. Maximo 5 errores, prioriza los mas importantes. Si el texto esta muy bien, dilo claramente y sugiere como llevarlo a C1.`;

const WRITING_EXERCISES = [
  {
    id: "email",
    title: "Email formal",
    emoji: "\uD83D\uDCE7",
    level: "B1-B2",
    prompt: "Escribe un email formal (80-100 palabras) solicitando informacion sobre un curso de ingles en una academia.",
    tips: ["Usa Dear Sir/Madam", "Incluye el motivo del email", "Cierra con Yours faithfully"],
  },
  {
    id: "opinion",
    title: "Opinion personal",
    emoji: "\uD83D\uDCAD",
    level: "B2",
    prompt: "Escribe un parrafo de opinion (80-100 palabras) sobre si las redes sociales son mas beneficiosas o perjudiciales para los jovenes.",
    tips: ["Empieza con In my opinion...", "Da al menos 2 razones", "Usa conectores: furthermore, however"],
  },
  {
    id: "description",
    title: "Descripcion",
    emoji: "\uD83D\uDDBC\uFE0F",
    level: "B1",
    prompt: "Describe tu ciudad o lugar favorito en ingles (60-80 palabras). Menciona que lo hace especial.",
    tips: ["Usa adjetivos variados", "Describe con detalle sensorial", "Incluye por que te gusta"],
  },
  {
    id: "story",
    title: "Historia corta",
    emoji: "\uD83D\uDCD6",
    level: "B1-B2",
    prompt: "Escribe el inicio de una historia corta (80-100 palabras) usando al menos 3 phrasal verbs.",
    tips: ["Empieza con accion", "Usa Past Simple y Past Continuous", "Incluye phrasal verbs en negrita"],
  },
  {
    id: "argument",
    title: "Argumentacion",
    emoji: "\u2696\uFE0F",
    level: "B2",
    prompt: "Escribe un argumento (100-120 palabras) a favor o en contra del trabajo remoto. Incluye ventajas, desventajas y conclusion.",
    tips: ["Usa On the other hand", "Da ejemplos concretos", "Concluye con To sum up"],
  },
  {
    id: "report",
    title: "Informe breve",
    emoji: "\uD83D\uDCCA",
    level: "B2",
    prompt: "Escribe un informe breve (80-100 palabras) describiendo los resultados de una encuesta sobre habitos de estudio en tu colegio.",
    tips: ["Usa pasiva: It was found that", "Incluye porcentajes ficticios", "Se objetivo y formal"],
  },
];

function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function getWordCountClass(words, exercise) {
  const minimum = 50;
  const maximum = exercise?.prompt.includes("100-120") ? 120 : exercise?.prompt.includes("80-100") ? 100 : 80;

  if (words < minimum) {
    return "text-slate-500 dark:text-slate-300";
  }

  if (words <= maximum) {
    return "text-emerald-600 dark:text-emerald-300";
  }

  return "text-orange-500 dark:text-orange-300";
}

function getScoreClasses(score) {
  if (score >= 90) {
    return { ring: "border-sky-500 text-sky-600 dark:text-sky-300", fill: "bg-sky-500/10 dark:bg-sky-500/20" };
  }

  if (score >= 70) {
    return { ring: "border-emerald-500 text-emerald-600 dark:text-emerald-300", fill: "bg-emerald-500/10 dark:bg-emerald-500/20" };
  }

  if (score >= 50) {
    return { ring: "border-orange-500 text-orange-600 dark:text-orange-300", fill: "bg-orange-500/10 dark:bg-orange-500/20" };
  }

  return { ring: "border-rose-500 text-rose-600 dark:text-rose-300", fill: "bg-rose-500/10 dark:bg-rose-500/20" };
}

function parseGroqJson(rawContent) {
  const trimmed = rawContent?.trim() ?? "";
  if (!trimmed) {
    throw new Error("empty-response");
  }

  const cleaned = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  const jsonText = firstBrace >= 0 && lastBrace >= 0 ? cleaned.slice(firstBrace, lastBrace + 1) : cleaned;

  return JSON.parse(jsonText);
}

function normalizeCorrection(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("invalid-correction");
  }

  return {
    overallScore: Math.max(0, Math.min(100, Number(raw.overallScore ?? 0))),
    level: raw.level || "B1",
    correctedText: raw.correctedText || "",
    summary: raw.summary || "No pude generar un resumen esta vez.",
    strengths: Array.isArray(raw.strengths) ? raw.strengths.slice(0, 4) : [],
    errors: Array.isArray(raw.errors)
      ? raw.errors.slice(0, 5).map((item) => ({
          original: item?.original || "",
          corrected: item?.corrected || "",
          explanation: item?.explanation || "",
        }))
      : [],
    suggestions: Array.isArray(raw.suggestions) ? raw.suggestions.slice(0, 4) : [],
    phrasalVerbsUsed: Array.isArray(raw.phrasalVerbsUsed) ? raw.phrasalVerbsUsed.filter(Boolean) : [],
    connectorsUsed: Array.isArray(raw.connectorsUsed) ? raw.connectorsUsed.filter(Boolean) : [],
    nextStep: raw.nextStep || "Sigue practicando con otro ejercicio para consolidar este nivel.",
  };
}

function ExerciseCard({ exercise, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(exercise)}
      className="glass-card overflow-hidden text-left transition hover:-translate-y-1"
    >
      <div className="h-2 w-full bg-gradient-to-r from-brand-green via-brand-blue to-brand-yellow" />
      <div className="p-6 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <span className="text-4xl">{exercise.emoji}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-100">
            {exercise.level}
          </span>
        </div>
        <h3 className="mt-5 text-2xl font-black text-slate-900 dark:text-white">{exercise.title}</h3>
        <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-300">{exercise.prompt}</p>
      </div>
    </button>
  );
}

export default function WritingPage() {
  const { recordQuizResult } = useUser();
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [text, setText] = useState("");
  const [showTips, setShowTips] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY?.trim() ?? "";
  const canUseGroq = Boolean(groqApiKey) && groqApiKey !== "pega_aqui_tu_key_de_groq";
  const wordCount = useMemo(() => countWords(text), [text]);
  const scoreClasses = getScoreClasses(result?.overallScore ?? 0);

  useEffect(() => {
    if ((result?.overallScore ?? 0) >= 70) {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.65 } });
    }
  }, [result?.overallScore]);

  async function handleCorrect() {
    if (!selectedExercise || wordCount < 20) {
      return;
    }

    if (!canUseGroq) {
      setError("Configura VITE_GROQ_API_KEY para usar la correccion con IA.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          max_tokens: 1000,
          messages: [
            { role: "system", content: WRITING_SYSTEM_PROMPT },
            { role: "user", content: `Ejercicio: ${selectedExercise.title}\nInstruccion: ${selectedExercise.prompt}\n\nTexto del estudiante:\n${text}` },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("groq-error");
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content ?? "";
      const normalized = normalizeCorrection(parseGroqJson(content));
      const pointsOverride = normalized.overallScore >= 90 ? 40 : normalized.overallScore >= 70 ? 20 : 0;
      const exerciseIndex = WRITING_EXERCISES.findIndex((item) => item.id === selectedExercise.id);

      await recordQuizResult(WRITING_MODULE_ID_BASE + Math.max(exerciseIndex, 0), normalized.overallScore, 100, {
        pointsOverride,
      });

      setResult(normalized);
    } catch {
      setError("No pude corregir tu texto esta vez. Intenta de nuevo en un momento.");
    } finally {
      setLoading(false);
    }
  }

  function handleResetText() {
    setText("");
    setResult(null);
    setError("");
  }

  function handleNewExercise() {
    setSelectedExercise(null);
    setText("");
    setResult(null);
    setError("");
    setShowTips(false);
  }

  return (
    <section className="space-y-6">
      <div className="glass-card p-6 sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.35em] text-slate-400">Practice Lab</p>
        <h2 className="mt-3 text-4xl font-black text-slate-900 dark:text-white">Practica tu escritura {"\u270D\uFE0F"}</h2>
        <p className="mt-4 max-w-3xl text-base font-semibold text-slate-500 dark:text-slate-300">
          Escribe en ingles y recibe correccion inmediata.
        </p>
      </div>

      {!selectedExercise ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {WRITING_EXERCISES.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} onSelect={setSelectedExercise} />
          ))}
        </div>
      ) : null}

      {selectedExercise ? (
        <div className="space-y-6">
          <div className="glass-card p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedExercise.emoji}</span>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white">{selectedExercise.title}</h3>
                </div>
                <p className="mt-4 max-w-3xl text-base font-semibold text-slate-600 dark:text-slate-300">{selectedExercise.prompt}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                {selectedExercise.level}
              </span>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowTips((current) => !current)}
                className="text-sm font-black text-brand-blue"
              >
                {showTips ? "Ocultar consejos" : "Ver consejos \uD83D\uDCA1"}
              </button>

              {showTips ? (
                <ul className="mt-4 space-y-2 rounded-[24px] bg-slate-50 p-5 text-sm font-semibold text-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
                  {selectedExercise.tips.map((tip) => (
                    <li key={tip}>- {tip}</li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="mt-6">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Empieza a escribir aqui..."
                className="min-h-[260px] w-full rounded-[28px] border border-slate-200 bg-white px-5 py-4 text-base font-semibold text-slate-900 outline-none transition focus:border-brand-blue dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <p className={`mt-3 text-sm font-black ${getWordCountClass(wordCount, selectedExercise)}`}>
                {wordCount} palabras
              </p>
            </div>

            {error ? <p className="mt-4 text-sm font-bold text-rose-500">{error}</p> : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCorrect}
                disabled={loading || wordCount < 20}
                className="pill-button bg-brand-green text-slate-950 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Corregir con IA {"\u2728"}
              </button>
              <button
                type="button"
                onClick={handleResetText}
                className="pill-button border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={handleNewExercise}
                className="pill-button border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                Nuevo ejercicio
              </button>
            </div>
          </div>

          {loading ? (
            <div className="glass-card p-8 sm:p-10 text-center">
              <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-brand-green/20" />
              <h3 className="mt-5 text-2xl font-black text-slate-900 dark:text-white">Analizando tu texto...</h3>
              <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-300">La IA esta revisando gramatica, cohesion, vocabulario y naturalidad.</p>
            </div>
          ) : null}

          {result ? (
            <div className="space-y-6">
              <div className="glass-card p-6 sm:p-8">
                <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
                  <div className={`flex h-36 w-36 items-center justify-center rounded-full border-8 text-center ${scoreClasses.ring} ${scoreClasses.fill}`}>
                    <div>
                      <p className="text-4xl font-black">{result.overallScore}</p>
                      <p className="mt-1 text-sm font-black uppercase tracking-[0.25em]">{result.level}</p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">Resumen general</h3>
                    <p className="mt-3 text-base font-semibold text-slate-600 dark:text-slate-300">{result.summary}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Texto corregido</h3>
                  <AudioButton text={result.correctedText} label="Escuchar texto corregido" />
                </div>
                <div className="mt-5 rounded-[28px] bg-emerald-500/10 p-5 text-base font-semibold leading-8 text-slate-900 dark:text-white">
                  {result.correctedText}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="glass-card p-6 sm:p-8">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Puntos fuertes {"\u2705"}</h3>
                  <ul className="mt-5 space-y-3">
                    {result.strengths.map((item) => (
                      <li key={item} className="rounded-[22px] bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-700 dark:text-emerald-200">{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="glass-card p-6 sm:p-8">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Siguiente paso {"\uD83D\uDE80"}</h3>
                  <div className="mt-5 rounded-[22px] bg-sky-500/10 px-5 py-4 text-sm font-semibold text-sky-900 dark:text-sky-100">
                    {result.nextStep}
                  </div>
                  {result.suggestions.length ? (
                    <ul className="mt-4 space-y-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {result.suggestions.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>

              <div className="glass-card p-6 sm:p-8">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Errores detectados {"\u274C"}</h3>
                <div className="mt-5 grid gap-4">
                  {result.errors.length ? result.errors.map((item, index) => (
                    <article key={`${item.original}-${index}`} className="rounded-[24px] border border-rose-200 bg-rose-50 p-5 dark:border-rose-500/30 dark:bg-rose-500/10">
                      <p className="text-sm font-black uppercase tracking-[0.25em] text-rose-500">Original</p>
                      <p className="mt-2 text-base font-bold text-rose-700 line-through dark:text-rose-200">{item.original}</p>
                      <p className="mt-4 text-sm font-black uppercase tracking-[0.25em] text-emerald-500">Correcto</p>
                      <p className="mt-2 text-base font-bold text-emerald-700 dark:text-emerald-200">{item.corrected}</p>
                      <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">{item.explanation}</p>
                    </article>
                  )) : <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No se detectaron errores graves. Muy buen trabajo.</p>}</div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="glass-card p-6 sm:p-8">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Phrasal verbs usados {"\uD83C\uDFAF"}</h3>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {result.phrasalVerbsUsed.length ? result.phrasalVerbsUsed.map((item) => (
                      <span key={item} className="rounded-full bg-brand-green/20 px-3 py-2 text-sm font-black text-brand-green">{item}</span>
                    )) : <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">No se detectaron phrasal verbs claros en este texto.</span>}
                  </div>
                </div>

                <div className="glass-card p-6 sm:p-8">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Conectores usados</h3>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {result.connectorsUsed.length ? result.connectorsUsed.map((item) => (
                      <span key={item} className="rounded-full bg-sky-500/15 px-3 py-2 text-sm font-black text-sky-700 dark:text-sky-200">{item}</span>
                    )) : <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">No se detectaron conectores formales destacados.</span>}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleResetText}
                  className="pill-button bg-brand-green text-slate-950 hover:brightness-110"
                >
                  Intentar de nuevo
                </button>
                <button
                  type="button"
                  onClick={handleNewExercise}
                  className="pill-button border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  Nuevo ejercicio
                </button>
                <Link
                  to="/ranking"
                  className="pill-button border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  Ver ranking
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
