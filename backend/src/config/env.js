// src/config/env.js
import dotenv from "dotenv";

// Load variables from backend/.env so PORT, JWT_SECRET, DATABASE_URL are available
dotenv.config();

export const env = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || "super-secret-aui-key",
  DATABASE_URL: process.env.DATABASE_URL || "file:./prisma/dev.db",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
};
