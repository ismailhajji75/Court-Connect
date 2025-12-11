// src/middleware/errorHandler.js
export const errorHandler = (err, req, res, next) => {
  console.error("❌ Server Error:", err);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message || "Internal server error",
  });
};
//modified