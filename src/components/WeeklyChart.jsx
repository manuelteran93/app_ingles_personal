import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

function WeeklyTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const value = payload[0]?.value ?? 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-soft dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
      {value} aprendidos
    </div>
  );
}

export default function WeeklyChart({ data, color }) {
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const allZero = data.every((item) => item.learned === 0);
  const neutralColor = isDark ? "#334155" : "#E2E8F0";
  const todayIndex = data.length - 1;

  if (allZero) {
    return (
      <div className="flex h-[180px] items-center justify-center rounded-[24px] bg-slate-50 text-center text-sm font-bold text-slate-500 dark:bg-slate-800/60 dark:text-slate-300">
        Empieza a aprender hoy para ver tu progreso aquí 🌱
      </div>
    );
  }

  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? "#CBD5E1" : "#64748B", fontSize: 12, fontWeight: 700 }}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? "#94A3B8" : "#94A3B8", fontSize: 12, fontWeight: 700 }}
          />
          <Tooltip cursor={{ fill: "transparent" }} content={<WeeklyTooltip />} />
          <Bar dataKey="learned" radius={[12, 12, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`${entry.day}-${index}`} fill={index === todayIndex ? color : neutralColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
