import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    continueAsGuest,
    isSupabaseConfigured,
    authMode,
  } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", username: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      if (mode === "login") {
        await signInWithEmail({ email: form.email, password: form.password });
        navigate(location.state?.from?.pathname ?? "/home", { replace: true });
      } else {
        await signUpWithEmail({
          email: form.email,
          password: form.password,
          username: form.username,
        });

        if (authMode === "demo") {
          navigate("/welcome", { replace: true });
        } else {
          setMessage("Cuenta creada. Si tu proyecto usa confirmación por email, revisa tu bandeja de entrada.");
        }
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");

    try {
      await signInWithGoogle();
      if (authMode === "demo") {
        navigate("/welcome", { replace: true });
      }
    } catch (googleError) {
      setError(googleError.message);
    }
  }

  async function handleGuestLogin() {
    setError("");
    setSubmitting(true);

    try {
      await continueAsGuest();
      navigate("/welcome", { replace: true });
    } catch (guestError) {
      setError(guestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_0.92fr]">
        <div className="glass-card overflow-hidden">
          <div className="bg-gradient-to-br from-brand-green via-brand-blue to-brand-purple p-8 text-white sm:p-10">
            <p className="text-sm font-black uppercase tracking-[0.35em] text-white/80">English Quest</p>
            <h1 className="mt-4 text-balance text-5xl font-black leading-tight sm:text-6xl">
              Aprende inglés como si fuera un juego.
            </h1>
            <p className="mt-5 max-w-xl text-lg font-semibold text-white/90">
              Lecciones ágiles, audio nativo, quizzes y ranking con amigos en una sola app.
            </p>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
            {[
              ["60", "phrasal verbs listos"],
              ["3", "módulos progresivos"],
              ["Local", "modo demo activo"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-[24px] bg-slate-50 p-4 text-center dark:bg-slate-800/70">
                <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
                <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-300">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3 rounded-full bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`pill-button flex-1 ${mode === "login" ? "bg-white text-slate-900 shadow-soft dark:bg-slate-950 dark:text-white" : "text-slate-500"}`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`pill-button flex-1 ${mode === "register" ? "bg-white text-slate-900 shadow-soft dark:bg-slate-950 dark:text-white" : "text-slate-500"}`}
            >
              Registrarme
            </button>
          </div>

          {!isSupabaseConfigured ? (
            <div className="rounded-[24px] border border-sky-200 bg-sky-50 p-5 text-sm font-semibold text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
              Supabase no está configurado. Para que no te bloquee, ya dejé activo un <strong>modo demo local</strong> y también un acceso rápido como invitado.
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "register" ? (
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200" htmlFor="username">
                  Nombre de usuario
                </label>
                <input
                  id="username"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required={mode === "register"}
                  className="w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition focus:border-brand-blue dark:border-slate-700 dark:bg-slate-900"
                  placeholder="ej. trader"
                />
              </div>
            ) : null}

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition focus:border-brand-blue dark:border-slate-700 dark:bg-slate-900"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition focus:border-brand-blue dark:border-slate-700 dark:bg-slate-900"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {error ? (
              <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="pill-button w-full bg-slate-900 py-3 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-brand-green dark:text-slate-950"
            >
              {submitting ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
            </button>
          </form>

          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={submitting}
            className="pill-button mt-4 w-full bg-brand-yellow py-3 text-slate-900 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Entrar como invitado
          </button>

          <div className="my-6 flex items-center gap-3 text-sm font-black uppercase tracking-[0.3em] text-slate-400">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            o
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={submitting}
            className="pill-button w-full border border-slate-200 bg-white py-3 text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
          >
            {isSupabaseConfigured ? "Continuar con Google" : "Continuar con Google (demo)"}
          </button>
        </div>
      </div>
    </div>
  );
}
