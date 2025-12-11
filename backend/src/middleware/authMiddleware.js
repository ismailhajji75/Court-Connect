// src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import prisma from "../config/prisma.js";

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        balance: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // extra guard: ensure token email matches stored user email
    if (decoded.email && decoded.email.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(401).json({ error: "Token does not match user" });
    }

    req.user = user; // includes balance, role, email, etc.
    next();
  } catch (err) {
    console.error("JWT ERROR:", err.message);
    return res.status(401).json({ error: "Not authorized, token invalid" });
  }
};
