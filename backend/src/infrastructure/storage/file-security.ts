import fs from "node:fs/promises";
import { AppError } from "../../shared/errors/app-error.js";

const jpeg = [0xff, 0xd8, 0xff];
const png = [0x89, 0x50, 0x4e, 0x47];
const riff = [0x52, 0x49, 0x46, 0x46];
const webp = [0x57, 0x45, 0x42, 0x50];

const startsWith = (bytes: Buffer, signature: number[]) => signature.every((v, i) => bytes[i] === v);

export const validateImageMagic = async (filePath: string, mimeType: string) => {
  const fd = await fs.open(filePath, "r");
  const buffer = Buffer.alloc(16);
  await fd.read(buffer, 0, 16, 0);
  await fd.close();

  if (mimeType === "image/jpeg" && startsWith(buffer, jpeg)) return true;
  if (mimeType === "image/png" && startsWith(buffer, png)) return true;
  if (mimeType === "image/webp" && startsWith(buffer, riff) && buffer.slice(8, 12).every((v, i) => v === webp[i])) return true;

  throw new AppError("Contenuto file non valido", 400, "INVALID_FILE_MAGIC");
};

export const sanitizeImageMetadata = async (_filePath: string) => {
  // Hook per futura sanitizzazione EXIF/metadata (es. re-encode server-side con libreria imaging).
  return;
};
