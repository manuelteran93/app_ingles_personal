export default function BadgeCard({ badge, unlocked }) {
  return (
    <article
      className={`rounded-[26px] border p-5 transition duration-300 ${
        unlocked
          ? "animate-badge-pop border-white/60 bg-gradient-to-br from-brand-yellow via-white to-brand-purple/60 text-slate-900 shadow-card"
          : "border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-900/80"
      }`}
    >
      <div className={`text-4xl ${unlocked ? "opacity-100" : "opacity-30"}`}>{badge.icon}</div>
      <h4 className={`mt-4 text-lg font-black ${unlocked ? "text-slate-900" : "text-slate-500 dark:text-slate-400"}`}>
        {badge.name}
      </h4>
      <p className={`mt-2 text-sm font-semibold ${unlocked ? "text-slate-700" : "text-slate-400 dark:text-slate-500"}`}>
        {unlocked ? badge.description : "Bloqueado"}
      </p>
    </article>
  );
}
