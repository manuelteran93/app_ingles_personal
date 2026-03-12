import { useEffect, useMemo, useRef, useState } from "react";
import { allPhrasalVerbs } from "../data/phrasalVerbs";

const INITIAL_MESSAGE = {
  id: "assistant-initial",
  role: "assistant",
  content:
    "¡Hola! 👋 Soy tu tutor de inglés con IA. Puedo ayudarte a practicar conversación, explicarte cualquier phrasal verb o corregir tu inglés. ¿Por dónde empezamos?",
};

const SYSTEM_PROMPT = `Eres un tutor de inglés amigable y paciente para hispanohablantes. Tu objetivo es ayudar a aprender phrasal verbs y conversación en inglés. Responde SIEMPRE en español pero incluye ejemplos y frases en inglés. Si el usuario escribe en inglés, corrige sus errores de forma amable al final del mensaje con la sección '✏️ Corrección:'. Cuando expliques un phrasal verb, siempre da 2 ejemplos de uso real. Sé conciso, usa emojis ocasionalmente y mantén un tono motivador.`;

function createMessage(role, content) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
  };
}

function looksLikeEnglish(text) {
  const lower = text.toLowerCase();
  const englishHints = [
    " i ",
    " you ",
    " he ",
    " she ",
    " we ",
    " they ",
    " is ",
    " are ",
    " do ",
    " does ",
    " can ",
    "please",
    "hello",
    "thanks",
  ];
  return englishHints.some((hint) => ` ${lower} `.includes(hint));
}

function findPhrasalVerb(text) {
  const lower = text.toLowerCase();
  return allPhrasalVerbs.find((item) => lower.includes(item.phrase.toLowerCase()));
}

function buildCorrection(text) {
  if (!looksLikeEnglish(text)) {
    return "";
  }

  const cleaned = text.trim();
  if (!cleaned) {
    return "";
  }

  const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  const normalized = /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
  return `\n\n✏️ Corrección:\nUna forma más natural sería: \"${normalized}\"`;
}

function getLocalTutorReply(userText) {
  const lower = userText.toLowerCase();
  const phrasalVerb = findPhrasalVerb(userText);

  if (/hola|hello|hi|buenas/.test(lower)) {
    return `¡Hola! Me alegra practicar contigo 😊\n\nPodemos hacer una de estas 3 cosas:\n1. Practicar conversación en inglés\n2. Explicar un phrasal verb\n3. Corregir una frase tuya\n\nSi quieres, escribe algo como: \"Explícame give up\" o \"Quiero practicar una conversación en inglés\".${buildCorrection(userText)}`;
  }

  if (phrasalVerb) {
    return `\"${phrasalVerb.phrase}\" significa \"${phrasalVerb.meaning}\". ${phrasalVerb.explanation}\n\nEjemplos:\n- ${phrasalVerb.example}\n- ${phrasalVerb.examples?.[1]?.sentence ?? phrasalVerb.example}\n\nTip rápido: intenta escribir ahora una oración tuya con \"${phrasalVerb.phrase}\" y yo te la corrijo.${buildCorrection(userText)}`;
  }

  if (/conversation|conversación|practicar|practice/.test(lower)) {
    return `Perfecto. Vamos a practicar conversación 🌟\n\nPregunta: \"What do you usually do in the morning?\"\n\nPuedes responder en inglés. Si quieres, usa un phrasal verb como \"wake up\", \"go out\" o \"pick up\" y yo te ayudo a corregirlo.${buildCorrection(userText)}`;
  }

  if (/phrasal|verbo|verb/.test(lower)) {
    return `Claro. Dime el phrasal verb que quieres estudiar y te explico:\n- significado\n- cómo se usa\n- 2 ejemplos reales\n\nPor ejemplo: \"Explícame look for\" o \"¿Qué significa carry out?\"${buildCorrection(userText)}`;
  }

  return `Entiendo. Te ayudo con eso 👍\n\nEn inglés podrías expresar esa idea con una frase simple como:\n- \"I want to improve my English step by step.\"\n- \"I am practicing every day.\"\n\nSi quieres, respóndeme con una frase en inglés y te la corrijo de forma amable.${buildCorrection(userText)}`;
}

function getPreferredMimeType() {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function speakText(text, onStart, onEnd) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text.replace(/🤖|👋|✏️/g, ""));
  utterance.lang = "es-ES";
  utterance.rate = 0.95;
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-lg dark:bg-slate-700">
        🤖
      </div>
      <div className="rounded-[22px] rounded-bl-md bg-slate-100 px-4 py-3 text-slate-700 shadow-soft dark:bg-slate-800 dark:text-slate-100">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s] dark:bg-slate-300" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s] dark:bg-slate-300" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 dark:bg-slate-300" />
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">escribiendo...</p>
      </div>
    </div>
  );
}

function ChatBubble({ message, speechSupported, speakingMessageId, onSpeak, onStop }) {
  const isAssistant = message.role === "assistant";
  const isSpeaking = speakingMessageId === message.id;

  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div className={`flex max-w-[88%] items-end gap-2 sm:max-w-[75%] ${isAssistant ? "flex-row" : "flex-row-reverse"}`}>
        {isAssistant ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-lg dark:bg-slate-700">
            🤖
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <div
            className={[
              "rounded-[24px] px-4 py-3 text-sm font-semibold leading-6 shadow-soft whitespace-pre-wrap",
              isAssistant
                ? "rounded-bl-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                : "rounded-br-md bg-brand-green text-white",
            ].join(" ")}
          >
            {message.content}
          </div>
          {isAssistant && speechSupported ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onSpeak(message)}
                className="self-start rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                {isSpeaking ? "🔊 Reproduciendo..." : "🔊 Escuchar"}
              </button>
              {isSpeaking ? (
                <button
                  type="button"
                  onClick={onStop}
                  className="self-start rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-600 transition hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20"
                >
                  ⏹ Stop
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const endRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const lastSpokenMessageIdRef = useRef(INITIAL_MESSAGE.id);

  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY?.trim() ?? "";
  const hasApiKey = Boolean(groqApiKey) && groqApiKey !== "pega_aqui_tu_key_de_groq";
  const visibleMessages = useMemo(() => messages, [messages]);
  const speechSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  const recordingSupported =
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== "undefined";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages, sending, isTranscribing]);

  useEffect(() => {
    return () => {
      if (speechSupported) {
        window.speechSynthesis.cancel();
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [speechSupported]);

  useEffect(() => {
    if (!autoSpeak || !speechSupported || sending || isTranscribing) {
      return;
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant" || lastMessage.id === lastSpokenMessageIdRef.current) {
      return;
    }

    lastSpokenMessageIdRef.current = lastMessage.id;
    speakText(
      lastMessage.content,
      () => setSpeakingMessageId(lastMessage.id),
      () => setSpeakingMessageId((current) => (current === lastMessage.id ? null : current)),
    );
  }, [messages, autoSpeak, speechSupported, sending, isTranscribing]);

  function stopMediaStream() {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }

  async function appendLocalReply(userText, bannerMessage = "") {
    const fallbackMessage = createMessage("assistant", getLocalTutorReply(userText));
    setMessages((current) => [...current, fallbackMessage]);
    setError(bannerMessage);
  }

  function handleSpeakMessage(message) {
    if (!speechSupported) {
      return;
    }

    lastSpokenMessageIdRef.current = message.id;
    speakText(
      message.content,
      () => setSpeakingMessageId(message.id),
      () => setSpeakingMessageId((current) => (current === message.id ? null : current)),
    );
  }

  function handleStopSpeaking() {
    if (!speechSupported) {
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
  }

  async function processUserMessage(rawText) {
    const trimmed = rawText.trim();
    if (!trimmed || sending) {
      return;
    }

    const userMessage = createMessage("user", trimmed);
    const nextMessages = [...messages, userMessage];
    const recentMessages = nextMessages.slice(-10).map((message) => ({
      role: message.role,
      content: message.content,
    }));

    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setError("");

    if (!hasApiKey) {
      await appendLocalReply(trimmed, "Modo local activo: agrega tu key de Groq en .env para respuestas en vivo.");
      setSending(false);
      return;
    }

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          max_tokens: 500,
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            ...recentMessages,
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("groq-request-failed");
      }

      const data = await response.json();
      const assistantContent = data?.choices?.[0]?.message?.content?.trim();

      if (!assistantContent) {
        throw new Error("groq-empty-response");
      }

      setMessages((current) => [...current, createMessage("assistant", assistantContent)]);
    } catch {
      await appendLocalReply(trimmed, "Hubo un error con Groq. Estoy respondiendo en modo local por ahora 🔄");
    } finally {
      setSending(false);
    }
  }

  async function transcribeAudio(audioBlob) {
    const formData = new FormData();
    const extension = audioBlob.type.includes("ogg") ? "ogg" : audioBlob.type.includes("mp4") ? "m4a" : "webm";
    const file = new File([audioBlob], `voice-note.${extension}`, { type: audioBlob.type || "audio/webm" });
    formData.append("file", file);
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("response_format", "json");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("groq-transcription-failed");
    }

    const data = await response.json();
    return data?.text?.trim() ?? "";
  }

  async function handleToggleListening() {
    if (!recordingSupported) {
      setError("Tu navegador no soporta grabación de audio en este momento.");
      return;
    }

    if (!hasApiKey) {
      setError("El dictado por voz necesita una key válida de Groq en el archivo .env 🎤");
      return;
    }

    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      recordedChunksRef.current = [];

      const preferredMimeType = getPreferredMimeType();
      const recorder = preferredMimeType
        ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream);

      recorder.onstart = () => {
        setError("");
        setIsRecording(true);
      };

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setError("No pude grabar el audio. Intenta otra vez 🎤");
        setIsRecording(false);
        stopMediaStream();
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        const audioBlob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || preferredMimeType || "audio/webm",
        });
        recordedChunksRef.current = [];
        mediaRecorderRef.current = null;
        stopMediaStream();

        if (!audioBlob.size) {
          setError("No detecté audio. Habla un poco más fuerte o más cerca del micrófono 🎤");
          return;
        }

        setIsTranscribing(true);
        setError("");

        try {
          const transcript = await transcribeAudio(audioBlob);

          if (!transcript) {
            throw new Error("empty-transcript");
          }

          await processUserMessage(transcript);
        } catch {
          setError("No pude transcribir tu audio con Groq. Intenta otra vez 🔄");
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
    } catch {
      setError("Permite el acceso al micrófono en tu navegador para usar el dictado 🎤");
      setIsRecording(false);
      stopMediaStream();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await processUserMessage(input);
  }

  function handleReset() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    stopMediaStream();

    if (speechSupported) {
      window.speechSynthesis.cancel();
    }

    lastSpokenMessageIdRef.current = INITIAL_MESSAGE.id;
    setMessages([INITIAL_MESSAGE]);
    setInput("");
    setError("");
    setSending(false);
    setIsRecording(false);
    setIsTranscribing(false);
    setSpeakingMessageId(null);
  }

  return (
    <section className="grid gap-6">
      <div className="glass-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-200/70 bg-white/70 px-5 py-4 dark:border-slate-700/80 dark:bg-slate-900/70 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Práctica conversacional</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Chat con IA</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">
              Escribe o habla: grabamos tu voz, la transcribimos con Groq y te respondemos en el chat.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAutoSpeak((current) => !current)}
              className={`pill-button ${autoSpeak ? "bg-brand-yellow text-slate-900" : "border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"}`}
            >
              {autoSpeak ? "Voz activada" : "Activar voz"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="pill-button border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
            >
              Limpiar chat
            </button>
          </div>
        </div>

        <div className="bg-[linear-gradient(180deg,rgba(247,247,247,0.95)_0%,rgba(237,245,237,0.95)_100%)] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.92)_0%,rgba(30,41,59,0.96)_100%)]">
          <div className="h-[60vh] min-h-[420px] overflow-y-auto px-4 py-5 sm:px-6">
            <div className="space-y-4">
              {visibleMessages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  speechSupported={speechSupported}
                  speakingMessageId={speakingMessageId}
                  onSpeak={handleSpeakMessage}
                  onStop={handleStopSpeaking}
                />
              ))}
              {sending || isTranscribing ? <TypingIndicator /> : null}
              <div ref={endRef} />
            </div>
          </div>

          {error ? (
            <div className="px-4 pb-3 text-sm font-bold text-amber-600 dark:text-amber-300 sm:px-6">{error}</div>
          ) : null}

          <form onSubmit={handleSubmit} className="border-t border-slate-200/70 bg-white/80 p-4 dark:border-slate-700/80 dark:bg-slate-900/80 sm:p-5">
            <div className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={1}
                placeholder="Escribe tu mensaje aquí..."
                className="min-h-[54px] flex-1 resize-none rounded-[22px] border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-800 outline-none transition focus:border-brand-blue dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <button
                type="button"
                onClick={handleToggleListening}
                disabled={sending || isTranscribing}
                className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-card transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 ${isRecording ? "bg-rose-500 text-white" : "bg-white text-slate-900 dark:bg-slate-800 dark:text-white"}`}
                aria-label="Dictar mensaje"
              >
                🎤
              </button>
              <button
                type="submit"
                disabled={sending || isTranscribing || !input.trim()}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue text-2xl text-white shadow-card transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Enviar mensaje"
              >
                ➜
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Se envían los últimos 10 mensajes para mantener el contexto.</span>
              <span>
                {isRecording
                  ? "Grabando audio... pulsa de nuevo para detener"
                  : isTranscribing
                    ? "Transcribiendo tu voz con Groq..."
                    : recordingSupported
                      ? "Micrófono listo"
                      : "Tu navegador no soporta grabación de audio"}
              </span>
              <span>{speechSupported ? "Lectura en voz alta disponible" : "Tu navegador no soporta lectura en voz alta"}</span>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

