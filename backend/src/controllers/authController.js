import bcrypt from "bcryptjs";
import { users } from "../data/mock.js";
import { signToken } from "../utils/jwt.js";

export const register = (req, res) => {
  console.log("REGISTER BODY:", req.body); // 🔍 debug

  // ✅ Guard: handle undefined body
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "username and password are required (send JSON in body)" });
  }

  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ error: "User already exists" });
  }

  const hashed = bcrypt.hashSync(password, 10);
  const user = { id: users.length + 1, username, password: hashed, role: "USER" };
  users.push(user);

  res
    .status(201)
    .json({ message: "Registered", user: { id: user.id, username } });
};

export const login = (req, res) => {
  console.log("LOGIN BODY:", req.body); // 🔍 debug

  const { username, password } = req.body || {};

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "username and password are required (send JSON in body)" });
  }

  const user = users.find((u) => u.username === username);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (!bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: "Wrong password" });

  const token = signToken({ id: user.id, username: user.username, role: user.role });
  res.json({ message: "Logged in", token });
};

export const getMe = (req, res) => {
  res.json(req.user);
};
