export const BADGES = [
  {
    id: "first_lesson",
    icon: "🌟",
    name: "Primer paso",
    description: "Aprende tu primer phrasal verb",
    condition: (stats) => stats.learnedCount >= 1,
  },
  {
    id: "ten_learned",
    icon: "🔥",
    name: "En racha",
    description: "Aprende 10 phrasal verbs",
    condition: (stats) => stats.learnedCount >= 10,
  },
  {
    id: "module_complete",
    icon: "🏆",
    name: "Módulo completo",
    description: "Completa un módulo entero",
    condition: (stats) => stats.completedModules >= 1,
  },
  {
    id: "all_modules",
    icon: "👑",
    name: "Maestro del inglés",
    description: "Completa los 3 módulos",
    condition: (stats) => stats.completedModules >= 3,
  },
  {
    id: "streak_7",
    icon: "⚡",
    name: "Una semana seguida",
    description: "Mantén una racha de 7 días",
    condition: (_stats, profile) => (profile?.current_streak ?? 0) >= 7,
  },
  {
    id: "streak_30",
    icon: "💎",
    name: "Dedicación total",
    description: "Mantén una racha de 30 días",
    condition: (_stats, profile) => (profile?.current_streak ?? 0) >= 30,
  },
  {
    id: "quiz_perfect",
    icon: "🎯",
    name: "Perfecto",
    description: "Saca 100% en un quiz",
    condition: (stats) => stats.perfectQuizzes >= 1,
  },
  {
    id: "fifty_learned",
    icon: "🚀",
    name: "Experto",
    description: "Aprende 50 phrasal verbs",
    condition: (stats) => stats.learnedCount >= 50,
  },
];

export function getBadgeById(badgeId) {
  return BADGES.find((badge) => badge.id === badgeId) ?? null;
}

export function checkBadges(stats, profile) {
  return BADGES.filter((badge) => badge.condition(stats, profile)).map((badge) => badge.id);
}
