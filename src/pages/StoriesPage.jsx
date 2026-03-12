import confetti from "canvas-confetti";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AudioButton from "../components/AudioButton";
import ProgressBar from "../components/ProgressBar";
import { useUnsplash } from "../hooks/useUnsplash";

const STORY_TOPICS = [
  { id: "travel", label: "Viajes", emoji: "\u2708\uFE0F", keyword: "travel adventure", level: "B\u00E1sico", color: "#00CD9C" },
  { id: "work", label: "Trabajo", emoji: "\uD83D\uDCBC", keyword: "office work", level: "Intermedio", color: "#FF9600" },
  { id: "food", label: "Comida", emoji: "\uD83C\uDF55", keyword: "restaurant food", level: "B\u00E1sico", color: "#FFC800" },
  { id: "technology", label: "Tecnolog\u00EDa", emoji: "\uD83D\uDCBB", keyword: "technology computer", level: "Intermedio", color: "#1CB0F6" },
  { id: "nature", label: "Naturaleza", emoji: "\uD83C\uDF3F", keyword: "nature forest", level: "B\u00E1sico", color: "#58CC02" },
  { id: "city", label: "Ciudad", emoji: "\uD83C\uDFD9\uFE0F", keyword: "city urban street", level: "Intermedio", color: "#64748B" },
  { id: "sports", label: "Deportes", emoji: "\u26BD", keyword: "sports athlete", level: "Avanzado", color: "#0F766E" },
  { id: "music", label: "M\u00FAsica", emoji: "\uD83C\uDFB5", keyword: "music concert", level: "Avanzado", color: "#CE82FF" },
  { id: "family", label: "Familia", emoji: "\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67", keyword: "family home", level: "B\u00E1sico", color: "#F97316" },
];

const STORY_SYSTEM_PROMPT = `Eres un generador de historias educativas en ingl\u00E9s para hispanohablantes. Cuando el usuario te diga un tema, genera una historia corta en ingl\u00E9s siguiendo EXACTAMENTE este formato JSON (sin markdown, sin backticks, solo JSON puro):
{
  "title": "T\u00EDtulo de la historia en ingl\u00E9s",
  "titleEs": "T\u00EDtulo en espa\u00F1ol",
  "paragraphs": [
    {
      "text": "P\u00E1rrafo en ingl\u00E9s (2-3 oraciones). Incluye al menos 1 phrasal verb.",
      "translation": "Traducci\u00F3n al espa\u00F1ol del p\u00E1rrafo.",
      "imageKeyword": "keyword en ingl\u00E9s para buscar imagen en Unsplash (1-2 palabras)",
      "phrasalVerbs": [
        { "verb": "phrasal verb usado", "meaning": "significado en espa\u00F1ol" }
      ]
    }
  ],
  "questions": [
    {
      "type": "comprehension",
      "question": "Pregunta de comprensi\u00F3n en espa\u00F1ol sobre la historia",
      "options": ["Opci\u00F3n A", "Opci\u00F3n B", "Opci\u00F3n C", "Opci\u00F3n D"],
      "correctIndex": 0,
      "explanation": "Explicaci\u00F3n breve de por qu\u00E9 es correcta en espa\u00F1ol"
    },
    {
      "type": "phrasal_verb",
      "question": "\u00BFQu\u00E9 significa '[phrasal verb de la historia]' en espa\u00F1ol?",
      "options": ["Opci\u00F3n A", "Opci\u00F3n B", "Opci\u00F3n C", "Opci\u00F3n D"],
      "correctIndex": 1,
      "explanation": "Explicaci\u00F3n del uso del phrasal verb"
    },
    {
      "type": "fill_blank",
      "question": "Completa: 'She decided to ___ the meeting because of the storm.'",
      "options": ["call off", "wake up", "look for", "give up"],
      "correctIndex": 0,
      "explanation": "Call off significa cancelar. Es la opci\u00F3n correcta porque..."
    },
    {
      "type": "translation",
      "question": "\u00BFC\u00F3mo se dice en ingl\u00E9s: '[frase en espa\u00F1ol de la historia]'?",
      "options": ["Opci\u00F3n A", "Opci\u00F3n B", "Opci\u00F3n C", "Opci\u00F3n D"],
      "correctIndex": 2,
      "explanation": "La traducci\u00F3n correcta es..."
    }
  ]
}
La historia debe tener exactamente 4 p\u00E1rrafos. El quiz debe tener exactamente 4 preguntas (una de cada tipo). Usa phrasal verbs del vocabulario cotidiano. Responde SOLO con el JSON, sin ning\u00FAn texto adicional.`;

const QUESTION_LABELS = {
  comprehension: "\uD83D\uDCD6 Comprensi\u00F3n",
  phrasal_verb: "\uD83D\uDD24 Phrasal verb",
  fill_blank: "\u270F\uFE0F Completa",
  translation: "\uD83C\uDF0D Traducci\u00F3n",
};

function getLevelClasses(level) {
  if (level === "Avanzado") {
    return "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-200";
  }

  if (level === "Intermedio") {
    return "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200";
  }

  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200";
}

function normalizeStory(rawStory, topic) {
  if (!rawStory || !Array.isArray(rawStory.paragraphs) || !Array.isArray(rawStory.questions)) {
    throw new Error("invalid-story");
  }

  return {
    title: rawStory.title || `${topic.label} Story`,
    titleEs: rawStory.titleEs || `Historia sobre ${topic.label}`,
    paragraphs: rawStory.paragraphs.slice(0, 4).map((paragraph, index) => ({
      text: paragraph.text || "",
      translation: paragraph.translation || "",
      imageKeyword: paragraph.imageKeyword || `${topic.keyword.split(" ")[0]} ${index + 1}`,
      phrasalVerbs: Array.isArray(paragraph.phrasalVerbs) ? paragraph.phrasalVerbs : [],
    })),
    questions: rawStory.questions.slice(0, 4).map((question) => ({
      ...question,
      options: Array.isArray(question.options) ? question.options.slice(0, 4) : [],
      correctIndex: Number(question.correctIndex ?? 0),
      explanation: question.explanation || "",
    })),
  };
}

function buildDemoStory(topic) {
  return {
    title: `${topic.label} Adventure`,
    titleEs: `Aventura de ${topic.label}`,
    paragraphs: [
      {
        text: `Laura decided to set off early because she wanted to enjoy her ${topic.label.toLowerCase()} day without rushing. She picked up a small notebook and wrote down her plans before leaving home.`,
        translation: `Laura decidi\u00F3 salir temprano porque quer\u00EDa disfrutar su d\u00EDa de ${topic.label.toLowerCase()} sin apuros. Tom\u00F3 un cuaderno peque\u00F1o y anot\u00F3 sus planes antes de salir de casa.`,
        imageKeyword: topic.keyword,
        phrasalVerbs: [
          { verb: "set off", meaning: "partir o salir hacia un lugar" },
          { verb: "pick up", meaning: "tomar o recoger algo" },
          { verb: "write down", meaning: "anotar" },
        ],
      },
      {
        text: `When she arrived, she looked around carefully and tried to figure out the best way to continue. Everything seemed new, but she did not give up.`,
        translation: `Cuando lleg\u00F3, mir\u00F3 a su alrededor con cuidado e intent\u00F3 entender cu\u00E1l era la mejor forma de continuar. Todo parec\u00EDa nuevo, pero no se rindi\u00F3.`,
        imageKeyword: `${topic.label.toLowerCase()} street`,
        phrasalVerbs: [
          { verb: "look around", meaning: "mirar alrededor o explorar" },
          { verb: "figure out", meaning: "descifrar o entender" },
          { verb: "give up", meaning: "rendirse" },
        ],
      },
      {
        text: `Later, she ran into a friendly local who helped her carry out her plan. They got along well and talked about simple ways to improve her English.`,
        translation: `M\u00E1s tarde, se encontr\u00F3 con una persona amable del lugar que la ayud\u00F3 a llevar a cabo su plan. Se llevaron bien y hablaron sobre formas simples de mejorar su ingl\u00E9s.`,
        imageKeyword: `${topic.label.toLowerCase()} people`,
        phrasalVerbs: [
          { verb: "run into", meaning: "encontrarse con alguien por casualidad" },
          { verb: "carry out", meaning: "llevar a cabo" },
          { verb: "get along", meaning: "llevarse bien" },
        ],
      },
      {
        text: `At the end of the day, Laura came back home feeling proud. She knew that small steps add up, and she looked forward to her next adventure.`,
        translation: `Al final del d\u00EDa, Laura volvi\u00F3 a casa sinti\u00E9ndose orgullosa. Sab\u00EDa que los peque\u00F1os pasos suman, y esperaba con ganas su siguiente aventura.`,
        imageKeyword: `${topic.label.toLowerCase()} sunset`,
        phrasalVerbs: [
          { verb: "come back", meaning: "volver o regresar" },
          { verb: "add up", meaning: "sumar o acumularse" },
          { verb: "look forward to", meaning: "esperar con ganas" },
        ],
      },
    ],
    questions: [
      { type: "comprehension", question: "\u00BFPor qu\u00E9 Laura sali\u00F3 temprano al principio de la historia?", options: ["Porque quer\u00EDa disfrutar el d\u00EDa con calma", "Porque hab\u00EDa perdido el autob\u00FAs", "Porque llegaba tarde al trabajo", "Porque no pod\u00EDa dormir"], correctIndex: 0, explanation: "Es correcta porque el primer p\u00E1rrafo dice que quer\u00EDa disfrutar el d\u00EDa sin apuros." },
      { type: "phrasal_verb", question: "\u00BFQu\u00E9 significa 'figure out' en la historia?", options: ["Olvidar", "Descifrar o entender", "Volver a casa", "Esperar"], correctIndex: 1, explanation: "'Figure out' se usa para expresar la idea de entender algo o encontrar una soluci\u00F3n." },
      { type: "fill_blank", question: "Completa: 'She did not ___ when things got difficult.'", options: ["look around", "give up", "come back", "write down"], correctIndex: 1, explanation: "'Give up' significa rendirse, por eso encaja cuando las cosas se ponen dif\u00EDciles." },
      { type: "translation", question: "\u00BFC\u00F3mo se dice en ingl\u00E9s: 'Ella regres\u00F3 a casa sinti\u00E9ndose orgullosa'?", options: ["She looked around home feeling proud.", "She set off home feeling proud.", "She came back home feeling proud.", "She gave up home feeling proud."], correctIndex: 2, explanation: "'Come back home' es la forma correcta de decir que ella regres\u00F3 a casa." },
    ],
  };
}

function HighlightedText({ text, phrasalVerbs }) {
  if (!phrasalVerbs?.length) {
    return <>{text}</>;
  }

  const sorted = [...phrasalVerbs].sort((left, right) => right.verb.length - left.verb.length);
  const escaped = sorted.map((item) => item.verb.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) => {
    const match = sorted.find((item) => item.verb.toLowerCase() === part.toLowerCase());
    if (!match) {
      return <span key={`${part}-${index}`}>{part}</span>;
    }

    return <span key={`${part}-${index}`} title={match.meaning} className="rounded-xl bg-brand-green/20 px-2 py-1 font-black text-brand-green dark:bg-brand-green/25">{part}</span>;
  });
}

function TopicCard({ topic, loading, onGenerate }) {
  const { imageUrl } = useUnsplash(topic.keyword);

  return (
    <article className="glass-card overflow-hidden">
      <div className="relative h-64 overflow-hidden">
        {imageUrl ? <img src={imageUrl} alt={topic.label} className="h-full w-full object-cover" /> : <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${topic.color}, rgba(15,23,42,0.9))` }} />}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white">
          <div className="flex items-start justify-between gap-3">
            <span className="text-4xl">{topic.emoji}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${getLevelClasses(topic.level)}`}>{topic.level}</span>
          </div>
          <h3 className="mt-8 text-3xl font-black">{topic.label}</h3>
          <p className="mt-3 text-sm font-semibold text-white/90">{"Genera una lectura corta, escucha cada p\u00E1rrafo y termina con un quiz de comprensi\u00F3n."}</p>
        </div>
      </div>
      <div className="p-5">
        <button type="button" onClick={() => onGenerate(topic)} disabled={loading} className="pill-button w-full bg-slate-900 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900">Generar historia</button>
      </div>
    </article>
  );
}

function StoryParagraphCard({ paragraph, index, selectedTopic, expanded, onToggleTranslation }) {
  const { imageUrl } = useUnsplash(paragraph.imageKeyword);

  return (
    <article className="glass-card overflow-hidden">
      <div className="relative h-52 overflow-hidden">
        {imageUrl ? <img src={imageUrl} alt={paragraph.imageKeyword} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-6xl text-white/90" style={{ background: `linear-gradient(135deg, ${selectedTopic.color}, rgba(15,23,42,0.92))` }}>{selectedTopic.emoji}</div>}
      </div>
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">{`P\u00E1rrafo ${index + 1}`}</p>
          <AudioButton text={paragraph.text} label={`Escuchar p\u00E1rrafo ${index + 1}`} />
        </div>
        <p className="mt-4 text-xl font-bold leading-8 text-slate-900 dark:text-white"><HighlightedText text={paragraph.text} phrasalVerbs={paragraph.phrasalVerbs} /></p>
        <button type="button" onClick={() => onToggleTranslation(index)} className="mt-5 text-sm font-black text-brand-blue">{expanded ? "Ocultar traducci\u00F3n \u261D" : "Ver traducci\u00F3n \uD83D\uDC47"}</button>
        {expanded ? <div className="mt-4 rounded-[22px] bg-slate-50 p-4 text-base font-semibold text-slate-700 dark:bg-slate-800/70 dark:text-slate-200">{paragraph.translation}</div> : null}
      </div>
    </article>
  );
}

export default function StoriesPage() {
  const [stage, setStage] = useState("selector");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [story, setStory] = useState(null);
  const [activeParagraph, setActiveParagraph] = useState(0);
  const [expandedTranslations, setExpandedTranslations] = useState({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY?.trim() ?? "";
  const canUseGroq = Boolean(groqApiKey) && groqApiKey !== "pega_aqui_tu_key_de_groq";
  const currentQuestion = story?.questions?.[questionIndex] ?? null;
  const score = selectedAnswers.filter((item) => item.isCorrect).length;

  useEffect(() => {
    if (stage === "results" && score >= 3) {
      confetti({ particleCount: 140, spread: 100, origin: { y: 0.7 } });
    }
  }, [stage, score]);

  async function requestStory(topic) {
    if (!canUseGroq) {
      return buildDemoStory(topic);
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 2000,
        messages: [
          { role: "system", content: STORY_SYSTEM_PROMPT },
          { role: "user", content: `Genera una historia sobre: ${topic.label}. Nivel: ${topic.level}` },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("groq-story-error");
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("empty-story");
    }

    return normalizeStory(JSON.parse(content), topic);
  }

  async function handleGenerateStory(topic) {
    setSelectedTopic(topic);
    setLoading(true);
    setError("");
    setStage("loading");
    setExpandedTranslations({});
    setSelectedAnswers([]);
    setQuestionIndex(0);
    setActiveParagraph(0);

    try {
      const nextStory = await requestStory(topic).catch(() => buildDemoStory(topic));
      setStory(nextStory);
      setStage("story");
    } catch {
      setError("No pude generar la historia esta vez. Intenta de nuevo.");
      setStage("selector");
    } finally {
      setLoading(false);
    }
  }

  function toggleTranslation(index) {
    setExpandedTranslations((current) => ({ ...current, [index]: !current[index] }));
  }

  function handleAnswer(optionIndex) {
    if (!currentQuestion || selectedAnswers[questionIndex]) {
      return;
    }

    const isCorrect = optionIndex === currentQuestion.correctIndex;
    setSelectedAnswers((current) => {
      const next = [...current];
      next[questionIndex] = { selectedIndex: optionIndex, isCorrect };
      return next;
    });
  }

  function handleNextQuestion() {
    if (questionIndex === story.questions.length - 1) {
      setStage("results");
      return;
    }

    setQuestionIndex((current) => current + 1);
  }

  function handleReset() {
    setStage("selector");
    setSelectedTopic(null);
    setStory(null);
    setActiveParagraph(0);
    setExpandedTranslations({});
    setQuestionIndex(0);
    setSelectedAnswers([]);
    setLoading(false);
    setError("");
  }

  const groupedTopics = useMemo(() => ({ basico: STORY_TOPICS.filter((topic) => topic.level === "B\u00E1sico"), intermedio: STORY_TOPICS.filter((topic) => topic.level === "Intermedio"), avanzado: STORY_TOPICS.filter((topic) => topic.level === "Avanzado") }), []);

  if (stage === "loading") {
    return <section className="glass-card p-8 text-center sm:p-10"><div className="mx-auto flex h-24 w-24 animate-float items-center justify-center rounded-[30px] bg-slate-100 text-5xl dark:bg-slate-800">{selectedTopic?.emoji}</div><h2 className="mt-6 text-3xl font-black text-slate-900 dark:text-white">Generando tu historia...</h2><p className="mt-3 text-base font-semibold text-slate-500 dark:text-slate-300">{canUseGroq ? "La IA est\u00E1 preparando una lectura personalizada para ti." : "Estamos preparando una historia demo para que practiques ahora mismo."}</p></section>;
  }

  if (stage === "story" && story && selectedTopic) {
    const progress = Math.round(((activeParagraph + 1) / story.paragraphs.length) * 100);

    return (
      <section className="space-y-6">
        <div className="glass-card p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-sm font-black uppercase tracking-[0.35em] text-slate-400">Lectura guiada</p><h2 className="mt-3 text-4xl font-black text-slate-900 dark:text-white">{story.title}</h2><p className="mt-2 text-base font-semibold text-slate-500 dark:text-slate-300">{story.titleEs}</p></div>
            <span className={`rounded-full px-4 py-2 text-sm font-black ${getLevelClasses(selectedTopic.level)}`}>{selectedTopic.level}</span>
          </div>
          <div className="mt-6"><div className="flex items-center justify-between gap-3"><p className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">{`P\u00E1rrafo ${activeParagraph + 1} de ${story.paragraphs.length}`}</p><p className="text-sm font-bold text-slate-500 dark:text-slate-300">{progress}%</p></div><div className="mt-3"><ProgressBar value={progress} color={selectedTopic.color} /></div></div>
        </div>

        <div className="grid gap-5">
          {story.paragraphs.map((paragraph, index) => <StoryParagraphCard key={`${story.title}-${index}`} paragraph={paragraph} index={index} selectedTopic={selectedTopic} expanded={Boolean(expandedTranslations[index])} onToggleTranslation={toggleTranslation} />)}
        </div>

        <div className="glass-card p-6 text-center">
          <div className="flex flex-wrap items-center justify-center gap-3">{story.paragraphs.map((_, index) => <button key={index} type="button" onClick={() => setActiveParagraph(index)} className={`h-3 w-14 rounded-full transition ${index <= activeParagraph ? "bg-brand-green" : "bg-slate-200 dark:bg-slate-700"}`} />)}</div>
          <button type="button" onClick={() => setStage("quiz")} className="pill-button mt-6 bg-brand-green px-8 py-4 text-lg font-black text-slate-950 hover:brightness-110">{"\u00A1Hacer el quiz! \uD83C\uDFAF"}</button>
        </div>
      </section>
    );
  }

  if (stage === "quiz" && story && currentQuestion) {
    const answerState = selectedAnswers[questionIndex];

    return (
      <section className="mx-auto max-w-3xl space-y-6">
        <div className="glass-card p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3"><span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 dark:bg-slate-800 dark:text-slate-100">{QUESTION_LABELS[currentQuestion.type] ?? currentQuestion.type}</span><p className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">{`Pregunta ${questionIndex + 1} de ${story.questions.length}`}</p></div>
          <h2 className="mt-5 text-3xl font-black text-slate-900 dark:text-white">{currentQuestion.question}</h2>
          <div className="mt-6 grid gap-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = answerState?.selectedIndex === index;
              const isCorrect = currentQuestion.correctIndex === index;
              const baseClass = "rounded-[22px] border px-5 py-4 text-left text-base font-bold transition";
              const stateClass = !answerState ? "border-slate-200 bg-white text-slate-900 hover:border-brand-blue hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800" : isCorrect ? "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-200" : isSelected ? "border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-200" : "border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500";
              return <button key={`${option}-${index}`} type="button" onClick={() => handleAnswer(index)} disabled={Boolean(answerState)} className={`${baseClass} ${stateClass}`}>{option}</button>;
            })}
          </div>
          {answerState ? <div className="mt-6 rounded-[22px] border-l-4 border-brand-yellow bg-[#FFF9E6] px-4 py-4 text-sm font-semibold text-amber-900 transition-opacity duration-300 dark:bg-amber-500/10 dark:text-amber-100">{"\uD83D\uDCA1 "}{currentQuestion.explanation}</div> : null}
          {answerState ? <button type="button" onClick={handleNextQuestion} className="pill-button mt-6 bg-slate-900 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900">{questionIndex === story.questions.length - 1 ? "Ver resultados" : "Siguiente"}</button> : null}
        </div>
      </section>
    );
  }

  if (stage === "results" && story && selectedTopic) {
    return (
      <section className="mx-auto max-w-4xl space-y-6">
        <div className="glass-card overflow-hidden text-center">
          <div className="p-8 sm:p-10" style={{ background: `linear-gradient(135deg, ${selectedTopic.color}, rgba(15,23,42,0.96))` }}><p className="text-sm font-black uppercase tracking-[0.35em] text-white/75">Resultado final</p><h2 className="mt-3 text-5xl font-black text-white">{score}/4</h2><p className="mt-4 text-lg font-bold text-white/90">{score >= 3 ? "\u00A1Muy bien! Comprendiste la mayor parte de la historia." : "Buen intento. Repasa la historia y vuelve a intentarlo."}</p></div>
          <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">{story.questions.map((question, index) => { const answer = selectedAnswers[index]; return <div key={`${question.question}-${index}`} className="rounded-[24px] bg-slate-50 p-5 text-left dark:bg-slate-800/70"><p className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">{QUESTION_LABELS[question.type]}</p><p className="mt-3 text-base font-bold text-slate-900 dark:text-white">{question.question}</p><p className={`mt-3 text-sm font-black ${answer?.isCorrect ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}>{answer?.isCorrect ? "Correcta" : "Incorrecta"}</p><p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">{question.explanation}</p></div>; })}</div>
          <div className="grid gap-3 border-t border-slate-100 p-6 dark:border-slate-800 sm:grid-cols-2"><button type="button" onClick={handleReset} className="pill-button w-full bg-brand-green text-slate-950 hover:brightness-110">Nueva historia</button><Link to="/ranking" className="pill-button w-full border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white">Ver ranking</Link></div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="glass-card p-6 sm:p-8"><p className="text-sm font-black uppercase tracking-[0.35em] text-slate-400">Lectura guiada</p><h2 className="mt-3 text-4xl font-black text-slate-900 dark:text-white">{"Historias en ingl\u00E9s"}</h2><p className="mt-4 max-w-3xl text-base font-semibold text-slate-500 dark:text-slate-300">{"Ahora s\u00ED puedes tocar \"Generar historia\" para abrir una historia completa con lectura guiada, im\u00E1genes reales por p\u00E1rrafo y audio con velocidad configurable."}</p>{error ? <p className="mt-4 text-sm font-bold text-rose-500">{error}</p> : null}</div>
      <div className="grid gap-4 sm:grid-cols-3"><div className="glass-card p-5"><p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Temas</p><p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{STORY_TOPICS.length}</p></div><div className="glass-card p-5"><p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Formato</p><p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{"4 p\u00E1rrafos"}</p></div><div className="glass-card p-5"><p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Quiz final</p><p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">4 preguntas</p></div></div>
      {[["B\u00E1sico", groupedTopics.basico], ["Intermedio", groupedTopics.intermedio], ["Avanzado", groupedTopics.avanzado]].map(([label, topics]) => <div key={label} className="space-y-4"><div className="flex items-center gap-4"><div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" /><span className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">{label}</span><div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" /></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{topics.map((topic) => <TopicCard key={topic.id} topic={topic} loading={loading} onGenerate={handleGenerateStory} />)}</div></div>)}
    </section>
  );
}