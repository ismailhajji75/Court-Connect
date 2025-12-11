// src/middleware/adminMiddleware.js
export const requireAdmin = (req, res, next) => {
  if (!req.user || !["ADMIN", "SUPERADMIN"].includes(req.user.role)) {
    return res.status(403).json({ error: "Admin or Superadmin only" });
  }
  next();
};
