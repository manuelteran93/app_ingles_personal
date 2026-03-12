import { createContext, useContext, useEffect, useState } from "react";
import { assertSupabase, isSupabaseConfigured, supabase } from "../lib/supabase";

const AuthContext = createContext(null);
const DEMO_USERS_KEY = "english-quest-demo-users";
const DEMO_SESSION_KEY = "english-quest-demo-session";

function readJson(key, fallbackValue) {
  if (typeof window === "undefined") {
    return fallbackValue;
  }

  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now()}`;
}

function toPublicDemoUser(userRecord) {
  if (!userRecord) {
    return null;
  }

  const { password, ...publicUser } = userRecord;
  return publicUser;
}

function createGuestAccount() {
  return {
    id: createId(),
    email: "invitado@englishquest.local",
    password: null,
    user_metadata: {
      username: "invitado",
      display_name: "Invitado",
      avatar_url: null,
    },
    app_metadata: {
      provider: "guest",
    },
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const sessionUserId = localStorage.getItem(DEMO_SESSION_KEY);
      const demoUsers = readJson(DEMO_USERS_KEY, []);
      const currentDemoUser = toPublicDemoUser(demoUsers.find((item) => item.id === sessionUserId));

      setSession(currentDemoUser ? { user: currentDemoUser, provider: "demo" } : null);
      setUser(currentDemoUser);
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    async function bootstrapAuth() {
      const client = assertSupabase();
      const {
        data: { session: currentSession },
      } = await client.auth.getSession();

      if (!mounted) {
        return;
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    }

    bootstrapAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  function startDemoSession(nextUser) {
    const publicUser = toPublicDemoUser(nextUser);
    localStorage.setItem(DEMO_SESSION_KEY, publicUser.id);
    setSession({ user: publicUser, provider: "demo" });
    setUser(publicUser);
    return { user: publicUser };
  }

  async function ensureUsernameAvailable(username) {
    const normalized = username.trim().toLowerCase();

    if (!isSupabaseConfigured) {
      const demoUsers = readJson(DEMO_USERS_KEY, []);
      const alreadyExists = demoUsers.some(
        (item) => item.user_metadata?.username?.toLowerCase() === normalized,
      );

      if (alreadyExists) {
        throw new Error("Ese nombre de usuario ya está en uso.");
      }

      return;
    }

    const client = assertSupabase();
    const { data, error } = await client
      .from("profiles")
      .select("id")
      .ilike("username", normalized)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (data) {
      throw new Error("Ese nombre de usuario ya está en uso.");
    }
  }

  async function signInWithEmail({ email, password }) {
    if (!isSupabaseConfigured) {
      const demoUsers = readJson(DEMO_USERS_KEY, []);
      const match = demoUsers.find(
        (item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password,
      );

      if (!match) {
        throw new Error("No encontramos una cuenta local con ese email y contraseña.");
      }

      return startDemoSession(match);
    }

    const client = assertSupabase();
    const { data, error } = await client.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }

    return data;
  }

  async function signUpWithEmail({ email, password, username }) {
    if (!isSupabaseConfigured) {
      const normalizedEmail = email.trim().toLowerCase();
      const trimmedUsername = username.trim();
      const normalizedUsername = trimmedUsername.toLowerCase();
      const demoUsers = readJson(DEMO_USERS_KEY, []);

      await ensureUsernameAvailable(trimmedUsername);

      if (demoUsers.some((item) => item.email.toLowerCase() === normalizedEmail)) {
        throw new Error("Ese email ya está registrado en modo local.");
      }

      const nextUser = {
        id: createId(),
        email: normalizedEmail,
        password,
        user_metadata: {
          username: normalizedUsername,
          display_name: trimmedUsername,
          avatar_url: null,
        },
        app_metadata: {
          provider: "email",
        },
      };

      writeJson(DEMO_USERS_KEY, [...demoUsers, nextUser]);
      return startDemoSession(nextUser);
    }

    const client = assertSupabase();
    await ensureUsernameAvailable(username);

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.trim().toLowerCase(),
          display_name: username.trim(),
        },
      },
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async function signInWithGoogle() {
    if (!isSupabaseConfigured) {
      const demoUsers = readJson(DEMO_USERS_KEY, []);
      let googleUser = demoUsers.find((item) => item.email === "demo.google@englishquest.local");

      if (!googleUser) {
        googleUser = {
          id: createId(),
          email: "demo.google@englishquest.local",
          password: null,
          user_metadata: {
            username: "google_demo",
            display_name: "Google Demo",
            avatar_url: null,
          },
          app_metadata: {
            provider: "google",
          },
        };

        writeJson(DEMO_USERS_KEY, [...demoUsers, googleUser]);
      }

      return startDemoSession(googleUser);
    }

    const client = assertSupabase();
    const { data, error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/home`,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async function continueAsGuest() {
    const demoUsers = readJson(DEMO_USERS_KEY, []);
    let guestUser = demoUsers.find((item) => item.email === "invitado@englishquest.local");

    if (!guestUser) {
      guestUser = createGuestAccount();
      writeJson(DEMO_USERS_KEY, [...demoUsers, guestUser]);
    }

    return startDemoSession(guestUser);
  }

  async function signOut() {
    if (!isSupabaseConfigured) {
      localStorage.removeItem(DEMO_SESSION_KEY);
      setSession(null);
      setUser(null);
      return;
    }

    const client = assertSupabase();
    const { error } = await client.auth.signOut();

    if (error) {
      throw error;
    }
  }

  const value = {
    session,
    user,
    loading,
    isSupabaseConfigured,
    isGuestUser: user?.app_metadata?.provider === "guest",
    authMode: isSupabaseConfigured ? "supabase" : "demo",
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    continueAsGuest,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return context;
}

