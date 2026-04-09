import multer from "multer";
import path from "node:path";
import { AppError } from "../../shared/errors/app-error.js";

const allowedMime = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/csv",
  "text/plain"
]);

const allowedExtensions = [".xlsx", ".csv"];

const hasAllowedExtension = (filename: string) => {
  const normalized = filename.toLowerCase();
  return allowedExtensions.some((ext) => normalized.endsWith(ext));
};

const isZipSignature = (buffer: Buffer) => {
  if (buffer.length < 4) return false;
  return (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) &&
    (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08)
  );
};

const looksLikeText = (buffer: Buffer) => {
  if (buffer.length === 0) return false;
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
  let printable = 0;

  for (const byte of sample) {
    if (byte === 0x00) return false;
    const isWhitespace = byte === 0x09 || byte === 0x0a || byte === 0x0d;
    const isAsciiPrintable = byte >= 0x20 && byte <= 0x7e;
    if (isWhitespace || isAsciiPrintable) printable += 1;
  }

  return printable / sample.length >= 0.9;
};

export const assertImportFileIntegrity = (file: Pick<Express.Multer.File, "originalname" | "buffer">) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (extension === ".xlsx") {
    if (!isZipSignature(file.buffer)) {
      throw new AppError("Contenuto file non coerente con .xlsx", 400, "IMPORT_FILE_CONTENT_INVALID");
    }
    return;
  }

  if (extension === ".csv") {
    if (!looksLikeText(file.buffer)) {
      throw new AppError("Contenuto file non coerente con .csv", 400, "IMPORT_FILE_CONTENT_INVALID");
    }
    return;
  }

  throw new AppError("Estensione file non supportata. Usa .xlsx o .csv", 400, "IMPORT_FILE_EXTENSION_INVALID");
};

export const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1
  },
  fileFilter: (_req, file, cb) => {
    if (!hasAllowedExtension(file.originalname)) {
      cb(new AppError("Estensione file non supportata. Usa .xlsx o .csv", 400, "IMPORT_FILE_EXTENSION_INVALID"));
      return;
    }

    if (!allowedMime.has(file.mimetype)) {
      cb(new AppError("Tipo file non supportato", 400, "IMPORT_FILE_TYPE_INVALID"));
      return;
    }

    cb(null, true);
  }
});
