export default function StreakBadge({ value = 0, className = "" }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm font-black text-orange-600 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300 ${className}`}
    >
      <span className="animate-flame text-lg">🔥</span>
      <span>{value} días</span>
    </div>
  );
}
