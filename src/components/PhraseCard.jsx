import AudioButton from "./AudioButton";
import ProgressBar from "./ProgressBar";
import { phraseExamples } from "../data/phraseExamples";

const IPA_PATTERN = /^\/[A-Za-z\u00E6\u0251\u0252\u0254\u0259\u025C\u026A\u028A\u0283\u0292\u014B\u00F0\u03B8\u02C8\u02CC\u02D0.()\-\s]+\/$/u;

function getDisplayPronunciation(phrase, moduleType) {
  const ipa = phrase?.ipa?.trim();

  if (moduleType === "grammar") {
    return ipa || "Revisa la formula y el ejemplo principal para practicar esta estructura.";
  }

  if (ipa && ipa.length <= 40 && IPA_PATTERN.test(ipa)) {
    return ipa;
  }

  return "Escucha el audio y usa las oraciones de ejemplo para practicar la pronunciacion.";
}

export default function PhraseCard({
  phrase,
  moduleColor,
  moduleType,
  progress,
  onKnow,
  onReview,
  currentStatus,
  disabled,
}) {
  const isGrammarModule = moduleType === "grammar";
  const displayPronunciation = getDisplayPronunciation(phrase, moduleType);
  const examples =
    phraseExamples[phrase.id] ?? [
      {
        sentence: phrase.example,
        translation: phrase.exampleTranslation,
        pronunciation: isGrammarModule
          ? "Escucha la estructura y usa la formula para recordar como se construye."
          : "Escucha la oracion para practicar la pronunciacion.",
      },
    ];

  return (
    <article className="glass-card overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">
              {isGrammarModule ? "Regla gramatical" : "Leccion activa"}
            </p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">{phrase.phrase}</h2>
          </div>
          <AudioButton text={phrase.phrase} label={`Escuchar ${phrase.phrase}`} />
        </div>

        <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[24px] bg-slate-50 p-5 dark:bg-slate-800/70">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">
              {isGrammarModule ? "Formula / Estructura" : "Pronunciacion base"}
            </p>
            <p className="mt-3 text-2xl font-bold text-slate-700 dark:text-slate-100">{displayPronunciation}</p>
            <p className="mt-6 text-sm font-black uppercase tracking-[0.3em] text-slate-400">Significado</p>
            <p className="mt-3 text-xl font-bold text-slate-700 dark:text-slate-100">{phrase.meaning}</p>
          </div>

          <div className="rounded-[24px] p-5 text-white" style={{ backgroundColor: moduleColor }}>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-white/80">Como usarla</p>
            <p className="mt-3 text-xl font-extrabold">{examples[0].sentence}</p>
            <p className="mt-4 text-base font-semibold text-white/90">{examples[0].translation}</p>
            <p className="mt-4 text-sm font-black uppercase tracking-[0.3em] text-white/80">
              {isGrammarModule ? "Clave de uso" : "Pronunciacion escrita"}
            </p>
            <p className="mt-2 text-sm font-semibold text-white/95">
              {phrase.explanation ?? examples[0].pronunciation}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[24px] border border-slate-200 p-5 dark:border-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">
                5 oraciones de ejemplo
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-300">
                Leelas, escucha cada una y usa la guia escrita para comprenderla mejor.
              </p>
            </div>
            <div className="w-full max-w-xs">
              <ProgressBar value={progress} color={moduleColor} showLabel />
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            {examples.map((example, index) => (
              <div key={`${phrase.id}-${index}`} className="rounded-[22px] bg-slate-50 p-4 dark:bg-slate-800/70">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-black text-slate-900 dark:text-white">
                      {index + 1}. {example.sentence}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {example.translation}
                    </p>
                    <p className="mt-3 text-xs font-black uppercase tracking-[0.25em] text-slate-400">
                      {isGrammarModule ? "Como se construye" : "Como pronunciarla"}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {isGrammarModule ? phrase.ipa : example.pronunciation}
                    </p>
                  </div>
                  <AudioButton text={example.sentence} label={`Escuchar oracion ${index + 1}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 p-4 dark:border-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">
                Estado actual
              </p>
              <p className="mt-2 text-lg font-bold text-slate-700 dark:text-slate-100">
                {currentStatus === "learned"
                  ? "Ya la dominaste"
                  : currentStatus === "reviewing"
                    ? "Marcada para repasar"
                    : "Aun sin responder"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-t border-slate-100 p-5 sm:grid-cols-2 dark:border-slate-800">
        <button
          type="button"
          onClick={onReview}
          disabled={disabled}
          className="pill-button w-full bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          Repasar {"\u{1F504}"}
        </button>
        <button
          type="button"
          onClick={onKnow}
          disabled={disabled}
          className="pill-button w-full text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: moduleColor }}
        >
          {"\u00A1Lo se!"} {"\u2705"}
        </button>
      </div>
    </article>
  );
}