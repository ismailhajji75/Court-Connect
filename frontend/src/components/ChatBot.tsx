import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  XIcon,
  SendIcon,
  BotIcon,
  ShieldAlert,
  Mic,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

const API_BASE = (import.meta as any).env?.VITE_API_URL || "/api";

export default function ChatBot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! Ask me about facilities, fees, availability, or rain.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [speakReplies, setSpeakReplies] = useState(true);

  const canSend = useMemo(() => input.trim().length > 1 && !loading, [input, loading]);
  const speechSupported =
    typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined";

  // Speak new assistant/system replies for accessibility
  useEffect(() => {
    if (!speechSupported || !speakReplies || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role === "user") return;
    const utterance = new SpeechSynthesisUtterance(last.content);
    utterance.rate = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [messages, speechSupported, speakReplies]);

  const send = async (override?: string) => {
    const content = (override ?? input).trim();
    if (!content || loading) return;
    const newUserMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
    setMessages((prev) => [...prev, newUserMessage]);
    if (!override) setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
        body: JSON.stringify({ message: content }),
      });
      if (!res.ok) throw new Error("Chat failed");
      const data = await res.json();
      const reply = data.reply || data.error || "I couldn't process that.";
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: res.ok ? "assistant" : "system", content: reply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "system",
          content: "Sorry, I couldn't reach the assistant. Try again shortly.",
        },
      ]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        await sendAudio(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Mic error", err);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "system", content: "Microphone is blocked or unavailable." },
      ]);
    }
  };

  const sendAudio = async (blob: Blob) => {
    if (!user?.token) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "system", content: "Please sign in to use voice input." },
      ]);
      return;
    }

    if (loading) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("audio", blob, "voice.webm");
      const res = await fetch(`${API_BASE}/audio/transcribe`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}` },
        body: form,
      });
      if (!res.ok) {
        let reason = "Transcription failed";
        try {
          const err = await res.json();
          reason = err?.error || err?.detail || reason;
        } catch {
          /* ignore JSON parsing */
        }
        throw new Error(reason);
      }
      const data = await res.json();
      const text = data.text?.trim();
      if (text) {
        await send(text);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "system", content: "Could not understand the audio." },
        ]);
      }
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Audio transcription failed. Try again.";
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "system", content: message },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Bubble */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl bg-[#063830] text-white hover:scale-105 transition"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-semibold">Ask AI</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 right-6 z-50 w-[360px] max-w-[90vw] bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-emerald-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-50">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                  <BotIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-[#063830]">CourtConnect AI</p>
                  <p className="text-xs text-gray-500">Quick help & rain checks</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {speechSupported && (
                  <button
                    onClick={() => setSpeakReplies((v) => !v)}
                    className="p-2 rounded-lg hover:bg-emerald-50 text-[#063830]"
                    title={speakReplies ? "Mute assistant voice" : "Enable assistant voice"}
                  >
                    {speakReplies ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <XIcon className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            <div
              ref={listRef}
              className="max-h-80 overflow-y-auto px-4 py-3 space-y-3 bg-gradient-to-b from-white to-emerald-50/40"
            >
              {messages.map((m) => (
                <div key={m.id} className="flex gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      m.role === "user" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {m.role === "user" ? "👤" : "🤖"}
                  </div>
                  <div
                    className={`px-3 py-2 rounded-2xl shadow-sm text-sm ${
                      m.role === "user"
                        ? "bg-emerald-50 text-emerald-900"
                        : m.role === "assistant"
                        ? "bg-white text-gray-800 border border-emerald-50"
                        : "bg-red-50 text-red-700 border border-red-100"
                    }`}
                    style={{ maxWidth: "75%" }}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Typing...
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-emerald-50 bg-white">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Ask about availability, fees, or rain..."
                  className="flex-1 px-3 py-2 rounded-xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 text-sm"
                />
                <button
                  onClick={() => send()}
                  disabled={!canSend}
                  className="p-2 rounded-xl bg-[#063830] text-white disabled:opacity-40 hover:shadow-lg transition"
                >
                  <SendIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={recording ? stopRecording : startRecording}
                  className={`p-2 rounded-xl border ${
                    recording ? "border-red-200 bg-red-50 text-red-600" : "border-emerald-100 bg-white text-emerald-700"
                  } hover:shadow-lg transition`}
                >
                  {recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-gray-500">
                <ShieldAlert className="w-3 h-3" />
                Ethical guard enabled; avoids harmful content.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
