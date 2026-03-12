import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { assertSupabase, isSupabaseConfigured } from "../lib/supabase";
import { allPhrasalVerbs, modules } from "../data/phrasalVerbs";
import { BADGES, checkBadges, getBadgeById } from "../data/badges";
import { diffInCalendarDays, toLocalDateString } from "../utils/date";
import { buildModuleProgress } from "../utils/moduleHelpers";
import { getNewLevel, getNextReviewDate, isDueForReview } from "../utils/srs";

const UserContext = createContext(null);
const THEME_KEY = "english-quest-theme";
const DEMO_DB_KEY = "english-quest-demo-db";

function getStoredTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  return localStorage.getItem(THEME_KEY) ?? "light";
}

function normalizeUsername(value, fallbackId) {
  const base = (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);

  return base.length >= 3 ? base : `user_${fallbackId.slice(0, 8)}`;
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now()}`;
}

function readDemoDb() {
  if (typeof window === "undefined") {
    return { profiles: {}, progress: {}, quizzes: {} };
  }

  try {
    const rawValue = localStorage.getItem(DEMO_DB_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : {};
    return {
      profiles: parsedValue.profiles ?? {},
      progress: parsedValue.progress ?? {},
      quizzes: parsedValue.quizzes ?? {},
    };
  } catch {
    return { profiles: {}, progress: {}, quizzes: {} };
  }
}

function writeDemoDb(data) {
  localStorage.setItem(DEMO_DB_KEY, JSON.stringify(data));
}

function normalizeProgressEntry(entry) {
  return {
    ...entry,
    srs_level: entry?.srs_level ?? 0,
    next_review_date: entry?.next_review_date ?? null,
  };
}

function buildStatsState(progressEntries, quizEntries, activeProfile) {
  const moduleProgress = buildModuleProgress(progressEntries);
  const completedModules = Object.values(moduleProgress).filter((item) => item.completed).length;
  const learnedCount = progressEntries.filter((entry) => entry.status === "learned").length;
  const perfectQuizzes = quizEntries.filter(
    (entry) => entry.score === entry.total_questions,
  ).length;

  return {
    completedModules,
    learnedCount,
    quizzesCompleted: quizEntries.length,
    totalModules: modules.length,
    perfectQuizzes,
    currentStreak: activeProfile?.current_streak ?? 0,
  };
}

function formatDateLabel(dateString) {
  if (!dateString) {
    return null;
  }

  return new Date(`${dateString}T00:00:00`).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
  });
}

export function UserProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [userProgress, setUserProgress] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(getStoredTheme);
  const [streakReminderEnabled, setStreakReminderEnabled] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(true);
  const [badgeQueue, setBadgeQueue] = useState([]);
  const [activeBadgeToast, setActiveBadgeToast] = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setUserProgress([]);
      setQuizResults([]);
      setOnboardingComplete(true);
      setBadgeQueue([]);
      setActiveBadgeToast(null);
      return;
    }

    const reminderKey = `english-quest-streak-reminder:${user.id}`;
    const onboardingKey = `english-quest-onboarding:${user.id}`;
    const reminderValue = localStorage.getItem(reminderKey);
    setStreakReminderEnabled(reminderValue === null ? true : reminderValue === "true");
    setOnboardingComplete(localStorage.getItem(onboardingKey) === "true");
  }, [user]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    refreshAll();
    return undefined;
  }, [user]);

  useEffect(() => {
    if (!activeBadgeToast && badgeQueue.length > 0) {
      setActiveBadgeToast(badgeQueue[0]);
      return undefined;
    }

    if (!activeBadgeToast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setBadgeQueue((current) => current.slice(1));
      setActiveBadgeToast(null);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [badgeQueue, activeBadgeToast]);

  const phraseMap = useMemo(
    () => new Map(allPhrasalVerbs.map((phrase) => [phrase.id, phrase])),
    [],
  );

  const normalizedProgress = useMemo(
    () => userProgress.map((entry) => normalizeProgressEntry(entry)),
    [userProgress],
  );

  const moduleProgress = useMemo(
    () => buildModuleProgress(normalizedProgress),
    [normalizedProgress],
  );

  const baseStats = useMemo(
    () => buildStatsState(normalizedProgress, quizResults, profile),
    [normalizedProgress, quizResults, profile],
  );

  const unlockedBadges = useMemo(
    () => checkBadges(baseStats, profile),
    [baseStats, profile],
  );

  const dueReviewItems = useMemo(() => {
    return normalizedProgress
      .filter((entry) => entry.srs_level > 0 && isDueForReview(entry.next_review_date))
      .map((entry) => {
        const phrase = phraseMap.get(entry.phrase_id);
        if (!phrase) {
          return null;
        }

        const module = modules.find((item) => item.id === entry.module_id);
        return {
          progressId: entry.id,
          moduleId: entry.module_id,
          moduleColor: module?.color ?? "#58CC02",
          moduleTitle: module?.title ?? "Repaso",
          phrase,
          status: entry.status,
          srsLevel: entry.srs_level,
          nextReviewDate: entry.next_review_date,
        };
      })
      .filter(Boolean)
      .sort((left, right) => {
        if ((left.nextReviewDate ?? "") === (right.nextReviewDate ?? "")) {
          return left.moduleId - right.moduleId;
        }

        return (left.nextReviewDate ?? "").localeCompare(right.nextReviewDate ?? "");
      });
  }, [normalizedProgress, phraseMap]);

  const nextReviewDate = useMemo(() => {
    const futureDates = normalizedProgress
      .map((entry) => entry.next_review_date)
      .filter((date) => date && date > toLocalDateString())
      .sort((left, right) => left.localeCompare(right));

    return futureDates[0] ?? null;
  }, [normalizedProgress]);

  const stats = useMemo(
    () => ({
      ...baseStats,
      unlockedBadges,
      dueReviewCount: dueReviewItems.length,
      nextReviewDate,
      nextReviewDateLabel: formatDateLabel(nextReviewDate),
    }),
    [baseStats, unlockedBadges, dueReviewItems.length, nextReviewDate],
  );

  function queueBadgeUnlocks(previousBadgeIds, nextBadgeIds) {
    const newBadgeIds = nextBadgeIds.filter((badgeId) => !previousBadgeIds.includes(badgeId));
    if (!newBadgeIds.length) {
      return;
    }

    const newBadges = newBadgeIds
      .map((badgeId) => getBadgeById(badgeId))
      .filter(Boolean);

    setBadgeQueue((current) => [...current, ...newBadges]);
  }

  function ensureDemoProfileRecord(db) {
    if (db.profiles[user.id]) {
      return db.profiles[user.id];
    }

    const generatedProfile = {
      id: user.id,
      username: normalizeUsername(
        user.user_metadata?.username ?? user.user_metadata?.display_name ?? user.email?.split("@")[0],
        user.id,
      ),
      avatar_url: user.user_metadata?.avatar_url ?? null,
      total_points: 0,
      current_streak: 0,
      longest_streak: 0,
      last_practice_date: null,
      created_at: new Date().toISOString(),
    };

    db.profiles[user.id] = generatedProfile;
    writeDemoDb(db);
    return generatedProfile;
  }

  async function ensureProfileRecord(client) {
    if (!isSupabaseConfigured) {
      const db = readDemoDb();
      return ensureDemoProfileRecord(db);
    }

    const profileResponse = await client.from("profiles").select("*").eq("id", user.id).maybeSingle();

    if (profileResponse.error && profileResponse.error.code !== "PGRST116") {
      throw profileResponse.error;
    }

    if (profileResponse.data) {
      return profileResponse.data;
    }

    const generatedUsername = normalizeUsername(
      user.user_metadata?.username ?? user.user_metadata?.display_name ?? user.email?.split("@")[0],
      user.id,
    );

    const insertedProfile = await client
      .from("profiles")
      .insert({
        id: user.id,
        username: generatedUsername,
        avatar_url: user.user_metadata?.avatar_url ?? null,
      })
      .select("*")
      .single();

    if (insertedProfile.error) {
      throw insertedProfile.error;
    }

    return insertedProfile.data;
  }

  async function refreshAll() {
    if (!user) {
      return;
    }

    setLoading(true);

    try {
      if (!isSupabaseConfigured) {
        const db = readDemoDb();
        const ensuredProfile = ensureDemoProfileRecord(db);
        const nextProgress = (db.progress[user.id] ?? []).map((entry) => normalizeProgressEntry(entry));
        const nextQuizzes = (db.quizzes[user.id] ?? []).sort(
          (left, right) => new Date(right.completed_at) - new Date(left.completed_at),
        );

        setProfile(ensuredProfile);
        setUserProgress(nextProgress);
        setQuizResults(nextQuizzes);
        return;
      }

      const client = assertSupabase();
      const ensuredProfile = await ensureProfileRecord(client);
      const [progressResponse, quizzesResponse] = await Promise.all([
        client.from("user_progress").select("*").eq("user_id", user.id),
        client.from("quiz_results").select("*").eq("user_id", user.id).order("completed_at", {
          ascending: false,
        }),
      ]);

      if (progressResponse.error) {
        throw progressResponse.error;
      }

      if (quizzesResponse.error) {
        throw quizzesResponse.error;
      }

      setProfile(ensuredProfile);
      setUserProgress((progressResponse.data ?? []).map((entry) => normalizeProgressEntry(entry)));
      setQuizResults(quizzesResponse.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfileWithPractice(basePoints = 0, profileSnapshot = profile) {
    if (!user || !profileSnapshot) {
      return { awardedPoints: 0, profile: profileSnapshot };
    }

    const today = toLocalDateString();
    const lastPracticeDate = profileSnapshot.last_practice_date;
    const dayGap = lastPracticeDate ? diffInCalendarDays(lastPracticeDate, today) : null;
    let currentStreak = profileSnapshot.current_streak ?? 0;
    let longestStreak = profileSnapshot.longest_streak ?? 0;
    let streakBonus = 0;

    if (lastPracticeDate !== today) {
      currentStreak = dayGap === 1 ? currentStreak + 1 : 1;
      longestStreak = Math.max(longestStreak, currentStreak);
      streakBonus = 10;
    }

    const nextProfile = {
      ...profileSnapshot,
      total_points: (profileSnapshot.total_points ?? 0) + basePoints + streakBonus,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_practice_date: today,
    };

    if (!isSupabaseConfigured) {
      const db = readDemoDb();
      db.profiles[user.id] = nextProfile;
      writeDemoDb(db);
      setProfile(nextProfile);
      return { awardedPoints: basePoints + streakBonus, profile: nextProfile };
    }

    const client = assertSupabase();
    const { data, error } = await client
      .from("profiles")
      .update({
        total_points: nextProfile.total_points,
        current_streak: nextProfile.current_streak,
        longest_streak: nextProfile.longest_streak,
        last_practice_date: nextProfile.last_practice_date,
      })
      .eq("id", user.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    setProfile(data);
    return { awardedPoints: basePoints + streakBonus, profile: data };
  }

  async function markPhraseStatus(moduleId, phraseId, status, options = {}) {
    if (!user) {
      return { awardedPoints: 0 };
    }

    const existing = normalizedProgress.find(
      (entry) => entry.module_id === moduleId && entry.phrase_id === phraseId,
    );
    const previousBadgeIds = checkBadges(
      buildStatsState(normalizedProgress, quizResults, profile),
      profile,
    );
    const nextLevel = getNewLevel(existing?.srs_level ?? 0, status === "learned");
    const nextReviewDate = getNextReviewDate(nextLevel);
    const basePoints =
      options.pointsOverride ??
      (status === "learned" && existing?.status !== "learned" ? 5 : 0);

    if (!isSupabaseConfigured) {
      const db = readDemoDb();
      const currentRows = (db.progress[user.id] ?? []).map((entry) => normalizeProgressEntry(entry));
      const nextRow = {
        id: existing?.id ?? createId(),
        user_id: user.id,
        module_id: moduleId,
        phrase_id: phraseId,
        status,
        srs_level: nextLevel,
        next_review_date: nextReviewDate,
        updated_at: new Date().toISOString(),
      };
      const nextProgress = [
        ...currentRows.filter(
          (entry) => !(entry.module_id === moduleId && entry.phrase_id === phraseId),
        ),
        nextRow,
      ];

      db.progress[user.id] = nextProgress;
      writeDemoDb(db);
      setUserProgress(nextProgress);

      const profileResult = await updateProfileWithPractice(basePoints, profile);
      const nextBadgeIds = checkBadges(
        buildStatsState(nextProgress, quizResults, profileResult.profile),
        profileResult.profile,
      );
      queueBadgeUnlocks(previousBadgeIds, nextBadgeIds);

      return { awardedPoints: profileResult.awardedPoints, learnedPoints: basePoints };
    }

    const client = assertSupabase();
    const { data, error } = await client
      .from("user_progress")
      .upsert(
        {
          user_id: user.id,
          module_id: moduleId,
          phrase_id: phraseId,
          status,
          srs_level: nextLevel,
          next_review_date: nextReviewDate,
        },
        {
          onConflict: "user_id,module_id,phrase_id",
        },
      )
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    const normalizedRow = normalizeProgressEntry(data);
    const nextProgress = [
      ...normalizedProgress.filter(
        (entry) => !(entry.module_id === moduleId && entry.phrase_id === phraseId),
      ),
      normalizedRow,
    ];
    setUserProgress(nextProgress);

    const profileResult = await updateProfileWithPractice(basePoints, profile);
    const nextBadgeIds = checkBadges(
      buildStatsState(nextProgress, quizResults, profileResult.profile),
      profileResult.profile,
    );
    queueBadgeUnlocks(previousBadgeIds, nextBadgeIds);

    return { awardedPoints: profileResult.awardedPoints, learnedPoints: basePoints };
  }

  async function recordQuizResult(moduleId, score, totalQuestions, options = {}) {
    if (!user) {
      return { awardedPoints: 0 };
    }

    const percentage = Math.round((score / totalQuestions) * 100);
    let quizPoints = 10;
    const bonusPoints = options.bonusPoints ?? 0;

    if (percentage === 100) {
      quizPoints = 50;
    } else if (percentage >= 70) {
      quizPoints = 30;
    }

    const totalPointsEarned = quizPoints + bonusPoints;
    const previousBadgeIds = checkBadges(
      buildStatsState(normalizedProgress, quizResults, profile),
      profile,
    );

    if (!isSupabaseConfigured) {
      const db = readDemoDb();
      const nextResult = {
        id: createId(),
        user_id: user.id,
        module_id: moduleId,
        score,
        total_questions: totalQuestions,
        points_earned: totalPointsEarned,
        completed_at: new Date().toISOString(),
      };
      const nextResults = [nextResult, ...(db.quizzes[user.id] ?? [])];
      db.quizzes[user.id] = nextResults;
      writeDemoDb(db);
      setQuizResults(nextResults);

      const profileResult = await updateProfileWithPractice(totalPointsEarned, profile);
      const nextBadgeIds = checkBadges(
        buildStatsState(normalizedProgress, nextResults, profileResult.profile),
        profileResult.profile,
      );
      queueBadgeUnlocks(previousBadgeIds, nextBadgeIds);

      return {
        awardedPoints: profileResult.awardedPoints,
        quizPoints: totalPointsEarned,
        bonusPoints,
        percentage,
      };
    }

    const client = assertSupabase();
    const { data, error } = await client
      .from("quiz_results")
      .insert({
        user_id: user.id,
        module_id: moduleId,
        score,
        total_questions: totalQuestions,
        points_earned: totalPointsEarned,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    const nextResults = [data, ...quizResults];
    setQuizResults(nextResults);
    const profileResult = await updateProfileWithPractice(totalPointsEarned, profile);
    const nextBadgeIds = checkBadges(
      buildStatsState(normalizedProgress, nextResults, profileResult.profile),
      profileResult.profile,
    );
    queueBadgeUnlocks(previousBadgeIds, nextBadgeIds);

    return {
      awardedPoints: profileResult.awardedPoints,
      quizPoints: totalPointsEarned,
      bonusPoints,
      percentage,
    };
  }

  function dismissBadgeToast() {
    setBadgeQueue((current) => current.slice(1));
    setActiveBadgeToast(null);
  }

  function completeOnboarding() {
    if (!user) {
      return;
    }

    localStorage.setItem(`english-quest-onboarding:${user.id}`, "true");
    setOnboardingComplete(true);
  }

  function toggleStreakReminder() {
    if (!user) {
      return;
    }

    const nextValue = !streakReminderEnabled;
    localStorage.setItem(`english-quest-streak-reminder:${user.id}`, String(nextValue));
    setStreakReminderEnabled(nextValue);
  }

  function toggleTheme() {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }

  const value = {
    profile,
    userProgress: normalizedProgress,
    quizResults,
    moduleProgress,
    stats,
    loading,
    theme,
    streakReminderEnabled,
    onboardingComplete,
    dueReviewItems,
    nextReviewDate,
    activeBadgeToast,
    refreshAll,
    markPhraseStatus,
    recordQuizResult,
    dismissBadgeToast,
    completeOnboarding,
    toggleStreakReminder,
    toggleTheme,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser debe usarse dentro de UserProvider.");
  }

  return context;
}


