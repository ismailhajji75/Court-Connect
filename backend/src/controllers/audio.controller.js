import fetch from "node-fetch";
import { env } from "../config/env.js";
import FormData from "form-data";

const OPENAI_AUDIO_URL = "https://api.openai.com/v1/audio/transcriptions";

// Transcribe audio via Whisper
export const transcribeAudio = async (req, res) => {
  try {
    if (!env.OPENAI_API_KEY) {
      return res
        .status(503)
        .json({ error: "Audio transcription unavailable: set OPENAI_API_KEY on the server." });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Audio file is required" });
    }

    const form = new FormData();
    form.append("file", req.file.buffer, { filename: req.file.originalname });
    form.append("model", "whisper-1");
    form.append("language", "en");

    const aiRes = await fetch(OPENAI_AUDIO_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        ...form.getHeaders(),
      },
      body: form,
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return res.status(500).json({ error: "Transcription failed", detail: txt });
    }

    const data = await aiRes.json();
    res.json({ text: data.text });
  } catch (err) {
    console.error("AUDIO ERROR", err);
    res.status(500).json({ error: "Transcription error" });
  }
};
