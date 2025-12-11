import express from "express";
import multer from "multer";
import { transcribeAudio } from "../controllers/audio.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

const router = express.Router();

router.post("/transcribe", protect, upload.single("audio"), transcribeAudio);

export default router;
