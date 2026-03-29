import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { env } from "../../shared/config/env.js";
import { AppError } from "../../shared/errors/app-error.js";

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedMime = new Set(["image/jpeg", "image/png", "image/webp"]);

export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      cb(null, `${Date.now()}-${safeName}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMime.has(file.mimetype)) {
      cb(new AppError("Tipo file non supportato", 400));
      return;
    }
    cb(null, true);
  }
});
