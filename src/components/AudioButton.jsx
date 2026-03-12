import { useEffect, useRef, useState } from "react";

export default function AudioButton({ text, label = "Escuchar pronunciación" }) {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  function handleSpeak() {
    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }

  return (
    <button
      type="button"
      onClick={handleSpeak}
      className="pill-button gap-3 bg-brand-blue text-white shadow-card hover:brightness-110"
      aria-label={label}
    >
      <span className="text-lg">🔊</span>
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
  );
}
