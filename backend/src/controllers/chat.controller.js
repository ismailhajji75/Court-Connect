import fetch from "node-fetch";
import { env } from "../config/env.js";
import { facilities, bookings, availabilities } from "../data/mock.js";
import { createBooking as createCourtBooking } from "./court.controller.js";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_AUDIO_URL = "https://api.openai.com/v1/audio/transcriptions";

// In-memory context per user to handle follow-up messages (facility/date remembered)
const pendingContext = new Map(); // key: userId -> { facilityId, date }

const fetchRainForecast = async () => {
  // Open-Meteo for Ifrane
  const url =
    "https://api.open-meteo.com/v1/forecast?latitude=33.5333&longitude=-5.1167&hourly=precipitation_probability&timezone=Africa%2FCasablanca";
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const next12 = (data?.hourly?.precipitation_probability || []).slice(0, 12);
  const max = Math.max(...next12, 0);
  return { maxProbability: max };
};

const includesAny = (q, words) => words.some((w) => q.includes(w));
const toIsoDate = (str) => {
  // supports YYYY-MM-DD or DD/MM/YYYY
  if (!str) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (!m) return null;
  const [_, d, mo, y] = m;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
};

// Parse natural dates like "12th December" or "December 12" (defaults to current year, bumps to next if past)
const naturalDate = (text) => {
  const months = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  };
  const lower = text.toLowerCase();
  const suffix = "(st|nd|rd|th)?";
  const re1 = new RegExp(`(\\d{1,2})${suffix}\\s+(january|february|march|april|may|june|july|august|september|october|november|december)(?:\\s+(\\d{4}))?`, "i");
  const re2 = new RegExp(`(january|february|march|april|may|june|july|august|september|october|november|december)\\s+(\\d{1,2})${suffix}(?:\\s+(\\d{4}))?`, "i");
  let m = lower.match(re1);
  if (!m) m = lower.match(re2);
  if (!m) return null;

  let day, monthName, year;
  if (m.length === 4 || m.length === 5) {
    // re1
    day = parseInt(m[1], 10);
    monthName = m[3]?.toLowerCase() || m[2]?.toLowerCase();
    year = m[4] ? parseInt(m[4], 10) : undefined;
  } else {
    // re2
    monthName = m[1]?.toLowerCase();
    day = parseInt(m[2], 10);
    year = m[4] ? parseInt(m[4], 10) : undefined;
  }
  const month = months[monthName];
  if (month === undefined || Number.isNaN(day)) return null;

  const now = new Date();
  const y = year ?? now.getFullYear();
  const dt = new Date(Date.UTC(y, month, day));

  // If no explicit year and date already passed this year, roll to next year
  if (!year) {
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    if (dt < today) dt.setUTCFullYear(dt.getUTCFullYear() + 1);
  }

  const iso = dt.toISOString().slice(0, 10);
  return iso;
};

// "today" / "tomorrow" helper for accessibility voice commands
const relativeToDate = (text) => {
  const lower = text?.toLowerCase() || "";
  const now = new Date();
  if (lower.includes("today")) {
    return now.toISOString().slice(0, 10);
  }
  if (lower.includes("tomorrow")) {
    const d = new Date(now);
    d.setDate(now.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  return null;
};

const normalizeFacility = (text) => {
  if (!text) return null;
  const t = text.toLowerCase();

  // Common aliases / misspellings
  const aliases = {
    padel: ["paddle", "paddel", "padle", "padl"],
    futsal: ["football sala", "sala"],
    basketball: ["basket", "basket ball"],
    bicycles: ["bike", "bikes", "bicycle"],
    "newfield-half-a": ["field a", "half a", "left side", "left field", "field left"],
    "newfield-half-b": ["field b", "half b", "right side", "right field", "field right"],
  };

  // Direct match on id or name (substring either way)
  const direct = facilities.find((f) => {
    const name = f.name.toLowerCase();
    const id = f.id.toLowerCase();
    return t.includes(id) || t.includes(name) || name.includes(t);
  });
  if (direct) return direct;

  // Alias match
  for (const [id, words] of Object.entries(aliases)) {
    if (words.some((w) => t.includes(w))) {
      const fac = facilities.find((f) => f.id === id);
      if (fac) return fac;
    }
  }

  // Type-level fallback (e.g., "tennis court" -> first tennis)
  if (t.includes("tennis")) {
    const fac = facilities.find((f) => f.type === "tennis");
    if (fac) return fac;
  }
  if (t.includes("padel") || t.includes("paddle") || t.includes("paddel")) {
    const fac = facilities.find((f) => f.type === "padel");
    if (fac) return fac;
  }
  if (t.includes("futsal")) {
    const fac = facilities.find((f) => f.type === "futsal");
    if (fac) return fac;
  }
  if (t.includes("soccer") || t.includes("field")) {
    const fac = facilities.find((f) => f.type === "soccer");
    if (fac) return fac;
  }
  if (t.includes("basket")) {
    const fac = facilities.find((f) => f.type === "basketball");
    if (fac) return fac;
  }
  if (t.includes("bike") || t.includes("bicycle")) {
    const fac = facilities.find((f) => f.type === "bicycles");
    if (fac) return fac;
  }

  return null;
};

const parseTime = (text) => {
  if (!text) return null;

  // quick keywords
  const lower = text.toLowerCase();
  if (lower.includes("noon")) return "12:00";
  if (lower.includes("midnight")) return "00:00";

  // handles "3 pm", "3pm", "15h", "15h30", "21:15" and skips day numbers like "13th"
  const re = /(\d{1,2})(?:[:h\s]?(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|am|pm|h)?/gi;
  let match = null;
  const candidates = [];

  while ((match = re.exec(text)) !== null) {
    let h = parseInt(match[1], 10);
    if (Number.isNaN(h)) continue;

    const mmRaw = match[2] ?? "00";
    const mmNum = Number(mmRaw);
    const mer = match[3]?.toLowerCase().replace(/\./g, "");

    // skip plain numbers immediately followed by letters (e.g., "13th") when no meridian/colon
    const endIdx = match.index + match[0].length;
    const nextChar = text[endIdx] || "";
    const followedByLetter = /[a-z]/i.test(nextChar);
    const hasExplicitMer = !!mer;
    const hasExplicitSeparator = !!match[2] || /[:h\s]/.test(match[0]);
    if (!hasExplicitMer && !hasExplicitSeparator && followedByLetter) {
      continue;
    }

    if (mer === "pm" && h < 12) h += 12;
    if (mer === "am" && h === 12) h = 0;

    if (h < 0 || h > 23) continue;
    if (Number.isNaN(mmNum) || mmNum > 59) continue;

    candidates.push({
      time: `${String(h).padStart(2, "0")}:${String(mmNum).padStart(2, "0")}`,
      hasMer: !!mer,
      index: match.index,
    });
  }

  if (!candidates.length) return null;

  // prefer matches with am/pm; otherwise, take the earliest candidate to avoid date-day collisions
  const withMer = candidates.filter((c) => c.hasMer);
  if (withMer.length) {
    return withMer[0].time;
  }

  return candidates[0].time;
};

const parseTimeRange = (text) => {
  const matches = [];
  const re = /(\d{1,2})(?:[:h\s]?(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|am|pm|h)?/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const startIdx = m.index;
    const snippet = text.slice(startIdx);
    // avoid date ordinals
    const nextChar = text[startIdx + m[0].length] || "";
    const followedByLetter = /[a-z]/i.test(nextChar);
    const mer = m[3]?.toLowerCase().replace(/\./g, "");
    const hasExplicit = !!mer || /[:h\s]/.test(m[0]);
    if (!hasExplicit && followedByLetter) continue;

    let h = parseInt(m[1], 10);
    const mmRaw = m[2] ?? "00";
    const mmNum = Number(mmRaw);
    if (Number.isNaN(h) || Number.isNaN(mmNum) || mmNum > 59) continue;
    if (mer === "pm" && h < 12) h += 12;
    if (mer === "am" && h === 12) h = 0;
    if (h < 0 || h > 23) continue;
    matches.push(`${String(h).padStart(2, "0")}:${String(mmNum).padStart(2, "0")}`);
    if (matches.length === 2) break;
  }
  return matches;
};

const summarizeAvailability = ({ facilityId, date }) => {
  // Booked slots
  const dayBookings = bookings
    .filter(
      (b) =>
        String(b.facilityId).toLowerCase() === String(facilityId).toLowerCase() &&
        b.date === date &&
        b.status !== "CANCELLED" &&
        b.status !== "REJECTED"
    )
    .map((b) => `${b.startTime}-${b.endTime}`);

  // Admin-provided availability windows
  const windows = availabilities
    .filter(
      (a) =>
        String(a.facilityId || a.facility).toLowerCase() ===
          String(facilityId).toLowerCase() && a.date === date
    )
    .map((a) => `${a.startTime}-${a.endTime}`);

  const booked = dayBookings.length ? `Booked: ${dayBookings.join(", ")}` : "No bookings yet.";
  const provided = windows.length
    ? `Admin slots: ${windows.join(", ")}`
    : "No admin slots defined; default schedule applies.";

  return `${booked} ${provided}`;
};

const checkAvailability = ({ facilityId, date, startTime }) => {
  const start = startTime;
  const endMinutes = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  const s = endMinutes(start);
  const e = s + 60;

  // booked slots
  const conflict = bookings.find(
    (b) =>
      b.date === date &&
      String(b.facilityId).toLowerCase() === String(facilityId).toLowerCase() &&
      b.status !== "CANCELLED" &&
      b.status !== "REJECTED" &&
      s < endMinutes(b.endTime) &&
      e > endMinutes(b.startTime)
  );

  // availability slots (admin provided)
  const slots = availabilities.filter(
    (a) =>
      a.date === date &&
      String(a.facilityId || a.facility).toLowerCase() === String(facilityId).toLowerCase()
  );
  const inProvidedWindow = slots.some((a) => {
    const startMin = endMinutes(a.startTime);
    const endMin = endMinutes(a.endTime);
    return s >= startMin && e <= endMin;
  });

  return { conflict, inProvidedWindow };
};

// Book directly via existing controller logic
const tryBooking = async ({ facilityId, date, startTime, user }) => {
  return await new Promise((resolve) => {
    const req = {
      user,
      body: {
        facilityId,
        date,
        startTime,
      },
    };
    const res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        resolve({ statusCode: this.statusCode, body: payload });
      },
    };
    createCourtBooking(req, res);
  });
};

const localShortAnswer = (question, context) => {
  const q = question.toLowerCase();

  // Small talk
  if (includesAny(q, ["hello", "hi", "hey", "how are you"])) {
    return "Hi! I’m here to help with bookings, availability, prices, and rain checks.";
  }

  // Facilities list
  if (includesAny(q, ["facility", "facilities", "what courts", "available courts"])) {
    return `Facilities available: ${context.facilities.map((f) => f.name).join(", ")}.`;
  }

  // Hours
  if (includesAny(q, ["hours", "opening", "open", "time"])) {
    return "Courts: 08:00–21:00 (weekdays) / 13:00–21:00 (weekends). Bicycles: 10:00–18:00.";
  }

  // Pricing
  if (includesAny(q, ["price", "fee", "cost", "mad"])) {
    return "Daytime is free. Lighting: 30 MAD (courts/padel/tennis), 40 MAD (half-field) after 18:00. Bicycles: 10 MAD/hour (admin approval).";
  }

  // Cancel
  if (q.includes("cancel")) {
    return "You can cancel your own booking up to 2 hours before start; admins can cancel anytime.";
  }

  // Availability check hint
  if (includesAny(q, ["availability", "available", "booked", "slot"])) {
    return "Tell me the facility and date/time, and I’ll check availability.";
  }

  return null;
};

export const chat = async (req, res) => {
  const { message } = req.body || {};
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required" });
  }

  // Ethics guard
  const banned = ["violence", "self-harm", "hate", "harass", "terror"];
  if (banned.some((b) => message.toLowerCase().includes(b))) {
    return res.status(400).json({ error: "I can't assist with that." });
  }

  // Live rain check
  if (message.toLowerCase().includes("rain")) {
    try {
      const rain = await fetchRainForecast();
      if (rain) {
        return res.json({
          reply:
            rain.maxProbability > 50
              ? `Rain risk is ${rain.maxProbability}% in the next 12 hours. Consider indoor options.`
              : `Rain risk is low (max ${rain.maxProbability}% in the next 12 hours).`,
        });
      }
    } catch (err) {
      // fall through
    }
  }

  const context = {
    facilities: facilities.map((f) => ({ name: f.name, id: f.id, type: f.type })),
    myBookings: bookings
      .filter((b) => req.user && b.userId === req.user.id)
      .map((b) => ({ facilityId: b.facilityId, date: b.date, startTime: b.startTime })),
  };

  // Quick availability intent handling
  // Try to reuse pending context for this user
  const userId = req.user?.id ?? null;
  const ctx = userId ? pendingContext.get(userId) : null;

  const facilityMatch = normalizeFacility(message);
  const timeMatch = parseTime(message);
  const rangeMatch = parseTimeRange(message);
  const effectiveTime = timeMatch || (rangeMatch.length ? rangeMatch[0] : null);
  const dateRaw = message.match(/\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/)?.[0];
  const dateMatch = toIsoDate(dateRaw) || naturalDate(message) || relativeToDate(message) || ctx?.date;
  const facilityResolved = facilityMatch || (ctx?.facilityId ? facilities.find((f) => f.id === ctx.facilityId) : null);

  // Handle direct booking intent for accessibility users
  const wantsBooking = /book|reserve/i.test(message);

  // Booking flow when all parts present
  if (facilityResolved && effectiveTime && dateMatch) {
    const { conflict, inProvidedWindow } = checkAvailability({
      facilityId: facilityResolved.id,
      date: dateMatch,
      startTime: effectiveTime,
    });
    if (conflict) {
      return res.json({
        reply: `${facilityResolved.name} is already booked at ${effectiveTime} on ${dateMatch}. Try another time.`,
      });
    }
    try {
      const bookingResult = await tryBooking({
        facilityId: facilityResolved.id,
        date: dateMatch,
        startTime: effectiveTime,
        user: req.user,
      });
      if (bookingResult.statusCode === 201 && bookingResult.body?.booking) {
        if (userId) pendingContext.delete(userId);
        return res.json({
          reply: `Booked ${facilityResolved.name} on ${dateMatch} at ${effectiveTime}. Status: ${bookingResult.body.booking.status}.`,
        });
      }
      return res.json({
        reply:
          bookingResult.body?.error ||
          `${facilityResolved.name} at ${effectiveTime} on ${dateMatch} is available${inProvidedWindow ? "" : " (no admin slot constraints found)"} but booking failed.`,
      });
    } catch (err) {
      console.error("AUTO BOOK ERROR", err);
      return res.json({
        reply: `${facilityResolved.name} at ${effectiveTime} on ${dateMatch} looks available, but I couldn't book it. Please try manually.`,
      });
    }
  }

  // Ask for missing parts instead of auto-booking wrong things
  if (facilityResolved && dateMatch && !effectiveTime) {
    if (userId) pendingContext.set(userId, { facilityId: facilityResolved.id, date: dateMatch });
    const summary = summarizeAvailability({ facilityId: facilityResolved.id, date: dateMatch });
    return res.json({
      reply: `${facilityResolved.name} on ${dateMatch}: ${summary} Tell me a start time (e.g., 08:00 or 8 am) to book.`,
    });
  }

  if (facilityResolved && effectiveTime && !dateMatch) {
    if (userId) pendingContext.set(userId, { facilityId: facilityResolved.id, date: null });
    return res.json({
      reply: `I can check ${facilityResolved.name} at ${effectiveTime}. Please provide a date (YYYY-MM-DD or say "today"/"tomorrow").`,
    });
  }

  if (facilityResolved && !dateMatch && !effectiveTime) {
    return res.json({
      reply: `${facilityResolved.name}: weekday hours ${facilityResolved.hours?.weekday || "N/A"}, weekend ${facilityResolved.hours?.weekend || "N/A"}. Tell me a date (e.g., 2025-12-12 or say tomorrow) and a time to check or book a slot.`,
    });
  }

  if (wantsBooking && (!facilityResolved || !effectiveTime || !dateMatch)) {
    return res.json({
      reply: "I can book for you. Tell me the facility name, date (e.g., 2025-12-10 or say tomorrow), and time (e.g., 3 pm or 15h30).",
    });
  }

  const canned = localShortAnswer(message, context);
  if (canned && !env.OPENAI_API_KEY) {
    return res.json({ reply: canned });
  }

  if (!env.OPENAI_API_KEY) {
    return res.json({
      reply:
        canned ||
        "I'm here to help with bookings, hours, availability, and rain checks. Tell me the facility and date/time to check a slot.",
    });
  }

  try {
    const payload = {
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant for CourtConnect. Keep answers concise. Use provided context for facilities and bookings. If asked about rain, keep it short. Decline unethical requests.",
        },
        {
          role: "user",
          content: `Context:\nFacilities: ${JSON.stringify(context.facilities)}\nUser bookings: ${JSON.stringify(
            context.myBookings
          )}\n\nQuestion: ${message}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    };

    const llmRes = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!llmRes.ok) {
      return res.status(500).json({ error: "Chat service unavailable" });
    }

    const json = await llmRes.json();
    const reply = json?.choices?.[0]?.message?.content?.trim();
    return res.json({ reply: reply || "I’m here to help with bookings and availability." });
  } catch (err) {
    console.error("CHAT ERROR", err);
    return res.status(500).json({ error: "Chat failed" });
  }
};
