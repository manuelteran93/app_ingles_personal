import { useEffect, useRef, useState } from "react";

const AUDIO_SPEED_KEY = "english-quest-audio-speed";
const SPEED_OPTIONS = [
  { id: "slow", label: "\uD83D\uDC22 Lento", rate: 0.6 },
  { id: "normal", label: "\uD83D\uDEB6 Normal", rate: 0.85 },
  { id: "fast", label: "\uD83D\uDE80 Rapido", rate: 1.1 },
];

function getStoredSpeedId() {
  if (typeof window === "undefined") {
    return "normal";
  }

  const stored = localStorage.getItem(AUDIO_SPEED_KEY);
  return SPEED_OPTIONS.some((option) => option.id === stored) ? stored : "normal";
}

export default function AudioButton({ text, label = "Escuchar pronunciacion" }) {
  const [speaking, setSpeaking] = useState(false);
  const [speedId, setSpeedId] = useState(getStoredSpeedId);
  const utteranceRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(AUDIO_SPEED_KEY, speedId);
  }, [speedId]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  function stopSpeaking() {
    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setSpeaking(false);
  }

  function handleSpeak() {
    if (!("speechSynthesis" in window)) {
      return;
    }

    const activeSpeed = SPEED_OPTIONS.find((option) => option.id === speedId) ?? SPEED_OPTIONS[1];
    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = activeSpeed.rate;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => {
      utteranceRef.current = null;
      setSpeaking(false);
    };
    utterance.onerror = () => {
      utteranceRef.current = null;
      setSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleSpeak}
          className="pill-button gap-3 bg-brand-blue text-white shadow-card hover:brightness-110"
          aria-label={label}
        >
          <span className="text-lg">{"\uD83D\uDD0A"}</span>
          <span>{speaking ? "Reproduciendo..." : "Escuchar"}</span>
          <span className="flex h-5 items-end gap-1">
            {[0, 1, 2].map((bar) => (
              <span
                key={bar}
                className={`w-1 rounded-full bg-white transition-all duration-200 ${
                  speaking ? "animate-pulse-soft" : "opacity-60"
                }`}
                style={{ height: speaking ? `${12 + bar * 4}px` : "8px" }}
              />
            ))}
          </span>
        </button>

        <button
          type="button"
          onClick={stopSpeaking}
          disabled={!speaking}
          className="pill-button border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
        >
          {"\u23F9"} Stop
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {SPEED_OPTIONS.map((option) => {
          const isActive = speedId === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setSpeedId(option.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-brand-green dark:text-slate-950"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
