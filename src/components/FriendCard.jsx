import StreakBadge from "./StreakBadge";

export default function FriendCard({ friend, isCurrentUser = false }) {
  const initial = friend.username?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <div className="glass-card flex items-center gap-4 p-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-purple text-xl font-black text-white shadow-card">
        {friend.avatar_url ? (
          <img src={friend.avatar_url} alt={friend.username} className="h-full w-full rounded-2xl object-cover" />
        ) : (
          initial
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-lg font-black text-slate-900 dark:text-white">{friend.username}</p>
          {isCurrentUser ? (
            <span className="rounded-full bg-brand-yellow px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
              Tú
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">
          {friend.total_points ?? 0} puntos totales
        </p>
      </div>
      <StreakBadge value={friend.current_streak ?? 0} />
    </div>
  );
}
