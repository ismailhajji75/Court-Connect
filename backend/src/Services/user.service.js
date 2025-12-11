import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Precomputed bcrypt hash to equalize timing when user is missing.
const DUMMY_PASSWORD_HASH =
  "$2b$10$CwTycUXWue0Thq9StjUM0uJ8BJzSDYBEmc6k9bS9Vn0eodui6w7q.";

export async function loginService({ email, password }) {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT secret not configured");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  const passwordToCheck = user?.password ?? DUMMY_PASSWORD_HASH;
  const passwordValid = await bcrypt.compare(password, passwordToCheck);

  if (!user || !passwordValid) {
    // Single message to avoid user enumeration.
    throw new Error("Invalid credentials");
  }

  if ("isActive" in user && user.isActive === false) {
    throw new Error("Account is disabled");
  }

  if ("emailVerified" in user && user.emailVerified === false) {
    throw new Error("Email not verified");
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    jwtSecret,
    { expiresIn: "1d" }
  );

  return {
    message: "Login successful",
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
  };
}
