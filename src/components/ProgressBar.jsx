export default function ProgressBar({ value = 0, color = "#58CC02", showLabel = false, className = "" }) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className={`w-full ${className}`}>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${safeValue}%`, backgroundColor: color }}
        />
      </div>
      {showLabel ? (
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          {safeValue}% completado
        </p>
      ) : null}
    </div>
  );
}
