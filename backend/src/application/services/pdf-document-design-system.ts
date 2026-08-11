import { rgb, type PDFFont, type PDFImage, type PDFPage, type RGB } from "pdf-lib";

export const A4_PAGE_WIDTH = 595.28;
export const A4_PAGE_HEIGHT = 841.89;

export const PDF_COLORS = {
  ink: rgb(0.035, 0.071, 0.129),
  text: rgb(0.09, 0.125, 0.196),
  muted: rgb(0.37, 0.43, 0.54),
  line: rgb(0.84, 0.88, 0.94),
  soft: rgb(0.965, 0.977, 0.996),
  white: rgb(1, 1, 1),
  success: rgb(0.047, 0.48, 0.302),
  warning: rgb(0.72, 0.36, 0.055),
  danger: rgb(0.75, 0.13, 0.17)
} as const;

export const normalizePdfText = (value?: string | null, fallback = "-") => {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized || fallback;
};

export const sanitizePdfHex = (value?: string | null, fallback = "#1d4ed8") => {
  const normalized = String(value ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized : fallback;
};

export const pdfRgbFromHex = (value: string): RGB => {
  const hex = sanitizePdfHex(value).slice(1);
  return rgb(
    Number.parseInt(hex.slice(0, 2), 16) / 255,
    Number.parseInt(hex.slice(2, 4), 16) / 255,
    Number.parseInt(hex.slice(4, 6), 16) / 255
  );
};

const splitLongToken = (token: string, maxWidth: number, font: PDFFont, fontSize: number) => {
  const chunks: string[] = [];
  let current = "";
  for (const character of token) {
    const candidate = `${current}${character}`;
    if (current && font.widthOfTextAtSize(candidate, fontSize) > maxWidth) {
      chunks.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
};

export const wrapPdfText = (text: string, maxWidth: number, font: PDFFont, fontSize: number) => {
  const normalized = normalizePdfText(text, "");
  if (!normalized) return [""];

  const tokens = normalized
    .split(" ")
    .flatMap((token) =>
      font.widthOfTextAtSize(token, fontSize) <= maxWidth
        ? [token]
        : splitLongToken(token, maxWidth, font, fontSize)
    );
  const lines: string[] = [];
  let current = "";

  for (const token of tokens) {
    const candidate = current ? `${current} ${token}` : token;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = token;
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
};

export const drawPdfText = (
  page: PDFPage,
  text: string,
  options: {
    x: number;
    y: number;
    maxWidth: number;
    font: PDFFont;
    fontSize: number;
    lineHeight?: number;
    color?: RGB;
    maxLines?: number;
  }
) => {
  const lineHeight = options.lineHeight ?? options.fontSize + 3;
  const wrapped = wrapPdfText(text, options.maxWidth, options.font, options.fontSize);
  const lines = typeof options.maxLines === "number" ? wrapped.slice(0, options.maxLines) : wrapped;
  let y = options.y;

  for (const line of lines) {
    page.drawText(line, {
      x: options.x,
      y,
      size: options.fontSize,
      font: options.font,
      color: options.color ?? PDF_COLORS.text
    });
    y -= lineHeight;
  }

  return { nextY: y, lines };
};

export const containPdfImage = (
  image: PDFImage,
  box: { x: number; y: number; width: number; height: number }
) => {
  const scale = Math.min(box.width / image.width, box.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return {
    x: box.x + (box.width - width) / 2,
    y: box.y + (box.height - height) / 2,
    width,
    height
  };
};
