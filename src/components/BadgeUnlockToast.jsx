export default function BadgeUnlockToast({ badge }) {
  if (!badge) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-50 w-[min(360px,calc(100%-2rem))] animate-slide-in-right rounded-[24px] border border-white/60 bg-white/95 p-4 shadow-card backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Nuevo logro</p>
      <div className="mt-3 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-yellow to-brand-purple text-3xl shadow-soft">
          {badge.icon}
        </div>
        <div>
          <p className="text-lg font-black text-slate-900 dark:text-white">{badge.name}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">{badge.description}</p>
        </div>
      </div>
    </div>
  );
}
