export default function QuizQuestion({
  question,
  selectedOption,
  revealAnswer,
  onAnswer,
  disabled,
  explanation,
}) {
  const answeredIncorrectly = revealAnswer && selectedOption && selectedOption !== question.correctAnswer;

  return (
    <div className="glass-card p-6 sm:p-8">
      <div className="mb-6">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">
          {question.type === "phrase-to-meaning" ? "Elige el significado" : "Elige el phrasal verb"}
        </p>
        <h2 className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{question.prompt}</h2>
        <p className="mt-3 text-base font-semibold text-slate-500 dark:text-slate-300">
          {question.supportText}
        </p>
      </div>

      <div className="grid gap-3">
        {question.options.map((option) => {
          const isSelected = selectedOption === option.label;
          const isCorrect = option.label === question.correctAnswer;
          const revealClasses = revealAnswer
            ? isCorrect
              ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
              : isSelected
                ? "border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200"
                : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            : isSelected
              ? "border-brand-blue bg-sky-50 text-brand-blue dark:bg-sky-500/10"
              : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onAnswer(option.label)}
              disabled={disabled || revealAnswer}
              className={`rounded-[22px] border px-4 py-4 text-left text-base font-bold transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed ${revealClasses}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {answeredIncorrectly && explanation ? (
        <div className="mt-5 border-l-4 border-[#FFC800] bg-[#FFF9E6] px-4 py-4 text-slate-800 opacity-100 transition-opacity duration-300 dark:bg-[#3B3318] dark:text-amber-100">
          <p className="text-sm font-bold leading-relaxed">
            <span className="mr-2">💡</span>
            {explanation}
          </p>
        </div>
      ) : null}
    </div>
  );
}
