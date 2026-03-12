import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

export default function WelcomePage() {
  const navigate = useNavigate();
  const { completeOnboarding } = useUser();

  function handleContinue() {
    completeOnboarding();
    navigate("/home", { replace: true });
  }

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="glass-card w-full max-w-5xl overflow-hidden">
        <div className="grid gap-8 p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.35em] text-slate-400">Bienvenido</p>
            <h1 className="mt-4 text-balance text-5xl font-black text-slate-900 dark:text-white">
              Tu plan para hablar inglés con más confianza.
            </h1>
            <p className="mt-5 text-lg font-semibold text-slate-500 dark:text-slate-300">
              Aquí practicarás phrasal verbs, escucharás pronunciación real y ganarás puntos cada vez que avances.
            </p>
            <button
              type="button"
              onClick={handleContinue}
              className="pill-button mt-8 bg-brand-green px-6 py-3 text-slate-950 hover:brightness-110"
            >
              Empezar ahora
            </button>
          </div>

          <div className="grid gap-4">
            {[
              ["1", "Aprende", "Tarjetas claras con significado, IPA y ejemplo."],
              ["2", "Practica", "Marca lo que ya dominas y lo que quieres repasar."],
              ["3", "Compite", "Suma puntos y sigue el ritmo de tus amigos en tiempo real."],
            ].map(([step, title, description]) => (
              <div key={step} className="rounded-[28px] bg-slate-50 p-5 dark:bg-slate-800/70">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-yellow to-brand-purple text-lg font-black text-slate-900">
                    {step}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">{title}</h2>
                    <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-300">{description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
