import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { assertSupabase, isSupabaseConfigured } from "../lib/supabase";
import { buildModuleProgress } from "../utils/moduleHelpers";
import { diffInCalendarDays, toLocalDateString } from "../utils/date";
import { modules } from "../data/phrasalVerbs";

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

export function UserProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [userProgress, setUserProgress] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(getStoredTheme);
  const [streakReminderEnabled, setStreakReminderEnabled] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(true);

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

  const moduleProgress = useMemo(() => buildModuleProgress(userProgress), [userProgress]);

  const stats = useMemo(() => {
    const completedModules = Object.values(moduleProgress).filter((item) => item.completed).length;
    const learnedCount = userProgress.filter((entry) => entry.status === "learned").length;

    return {
      completedModules,
      learnedCount,
      quizzesCompleted: quizResults.length,
      totalModules: modules.length,
    };
  }, [moduleProgress, quizResults, userProgress]);

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
        const nextProgress = db.progress[user.id] ?? [];
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
      setUserProgress(progressResponse.data ?? []);
      setQuizResults(quizzesResponse.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfileWithPractice(basePoints = 0) {
    if (!user || !profile) {
      return 0;
    }

    const today = toLocalDateString();
    const lastPracticeDate = profile.last_practice_date;
    const dayGap = lastPracticeDate ? diffInCalendarDays(lastPracticeDate, today) : null;
    let currentStreak = profile.current_streak ?? 0;
    let longestStreak = profile.longest_streak ?? 0;
    let streakBonus = 0;

    if (lastPracticeDate !== today) {
      currentStreak = dayGap === 1 ? currentStreak + 1 : 1;
      longestStreak = Math.max(longestStreak, currentStreak);
      streakBonus = 10;
    }

    const updates = {
      ...profile,
      total_points: (profile.total_points ?? 0) + basePoints + streakBonus,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_practice_date: today,
    };

    if (!isSupabaseConfigured) {
      const db = readDemoDb();
      db.profiles[user.id] = updates;
      writeDemoDb(db);
      setProfile(updates);
      return basePoints + streakBonus;
    }

    const client = assertSupabase();
    const { data, error } = await client
      .from("profiles")
      .update({
        total_points: updates.total_points,
        current_streak: updates.current_streak,
        longest_streak: updates.longest_streak,
        last_practice_date: updates.last_practice_date,
      })
      .eq("id", user.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    setProfile(data);
    return basePoints + streakBonus;
  }

  async function markPhraseStatus(moduleId, phraseId, status) {
    if (!user) {
      return { awardedPoints: 0 };
    }

    const existing = userProgress.find(
      (entry) => entry.module_id === moduleId && entry.phrase_id === phraseId,
    );
    const learnedPoints = status === "learned" && existing?.status !== "learned" ? 5 : 0;

    if (!isSupabaseConfigured) {
      const db = readDemoDb();
      const currentRows = db.progress[user.id] ?? [];
      const nextRow = {
        id: existing?.id ?? createId(),
        user_id: user.id,
        module_id: moduleId,
        phrase_id: phraseId,
        status,
        updated_at: new Date().toISOString(),
      };
      const nextRows = [
        ...currentRows.filter(
          (entry) => !(entry.module_id === moduleId && entry.phrase_id === phraseId),
        ),
        nextRow,
      ];

      db.progress[user.id] = nextRows;
      writeDemoDb(db);
      setUserProgress(nextRows);

      const awardedPoints = await updateProfileWithPractice(learnedPoints);
      return { awardedPoints, learnedPoints };
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

    setUserProgress((current) => {
      const next = current.filter(
        (entry) => !(entry.module_id === moduleId && entry.phrase_id === phraseId),
      );
      return [...next, data];
    });

    const awardedPoints = await updateProfileWithPractice(learnedPoints);
    return { awardedPoints, learnedPoints };
  }

  async function recordQuizResult(moduleId, score, totalQuestions) {
    if (!user) {
      return { awardedPoints: 0 };
    }

    const percentage = Math.round((score / totalQuestions) * 100);
    let quizPoints = 10;

    if (percentage === 100) {
      quizPoints = 50;
    } else if (percentage >= 70) {
      quizPoints = 30;
    }

    if (!isSupabaseConfigured) {
      const db = readDemoDb();
      const nextResult = {
        id: createId(),
        user_id: user.id,
        module_id: moduleId,
        score,
        total_questions: totalQuestions,
        points_earned: quizPoints,
        completed_at: new Date().toISOString(),
      };
      const nextResults = [nextResult, ...(db.quizzes[user.id] ?? [])];
      db.quizzes[user.id] = nextResults;
      writeDemoDb(db);
      setQuizResults(nextResults);

      const awardedPoints = await updateProfileWithPractice(quizPoints);
      return {
        awardedPoints,
        quizPoints,
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
        points_earned: quizPoints,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    setQuizResults((current) => [data, ...current]);
    const awardedPoints = await updateProfileWithPractice(quizPoints);

    return {
      awardedPoints,
      quizPoints,
      percentage,
    };
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
    userProgress,
    quizResults,
    moduleProgress,
    stats,
    loading,
    theme,
    streakReminderEnabled,
    onboardingComplete,
    refreshAll,
    markPhraseStatus,
    recordQuizResult,
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
