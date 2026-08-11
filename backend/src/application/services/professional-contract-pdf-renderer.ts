import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import type { EnterpriseContractPdfInput } from "./enterprise-contract-pdf-service.js";
import {
  A4_PAGE_HEIGHT,
  A4_PAGE_WIDTH,
  containPdfImage,
  pdfRgbFromHex,
  sanitizePdfHex,
  wrapPdfText
} from "./pdf-document-design-system.js";

type Field = { label: string; value: string; emphasize?: boolean };

const PAGE_W = A4_PAGE_WIDTH;
const PAGE_H = A4_PAGE_HEIGHT;
const MARGIN = 42;
const CONTENT_W = PAGE_W - MARGIN * 2;
const CONTENT_BOTTOM = 68;
const FOOTER_Y = 38;

const COLORS = {
  ink: rgb(0.035, 0.055, 0.09),
  text: rgb(0.08, 0.105, 0.15),
  muted: rgb(0.35, 0.4, 0.49),
  line: rgb(0.77, 0.81, 0.87),
  lineLight: rgb(0.88, 0.9, 0.93),
  success: rgb(0.04, 0.46, 0.24)
} as const;

const BOOKING_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Bozza",
  QUOTED: "Preventivo",
  HOLD: "Opzione",
  CONFIRMED: "Confermata",
  CONTRACT_SIGNED: "Contratto firmato",
  READY_FOR_HANDOVER: "Pronta consegna",
  IN_RENT: "In noleggio",
  CLOSED: "Chiusa",
  CANCELED: "Annullata",
  NO_SHOW: "No-show"
};

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Bozza",
  READY: "Pronto",
  SENT: "Inviato",
  SIGNED: "Firmato",
  ERROR: "Errore",
  NOT_READY: "Non pronto"
};

const BASE_RATE_UNIT_LABELS: Record<string, string> = {
  DAILY: "Giornaliera",
  WEEKLY: "Settimanale",
  MONTHLY: "Mensile"
};

const asText = (value?: string | null, fallback = "-") => {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized || fallback;
};

const safeDate = (value?: Date | string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value?: Date | string | null) => {
  const parsed = safeDate(value);
  return parsed ? parsed.toLocaleDateString("it-IT") : "-";
};

const formatDateTime = (value?: Date | string | null) => {
  const parsed = safeDate(value);
  if (!parsed) return "-";
  return parsed.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const formatNumber = (value?: number | null, digits = 0) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
};

const formatMoney = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return `${new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)} EUR`;
};

const labelOf = (labels: Record<string, string>, raw?: string | null) => {
  const key = String(raw ?? "").trim().toUpperCase();
  return key ? labels[key] ?? key.replace(/_/g, " ") : "-";
};

const compact = (...values: Array<string | null | undefined>) =>
  values
    .map((value) => asText(value, ""))
    .filter(Boolean)
    .join(" | ");

const fullCustomerName = (input: EnterpriseContractPdfInput["booking"]) => {
  const first = asText(input.customer?.firstName, "");
  const last = asText(input.customer?.lastName, "");
  return `${first} ${last}`.trim() || asText(input.customerName);
};

const kmTravelled = (pickupKm?: number | null, returnKm?: number | null) => {
  if (typeof pickupKm !== "number" || typeof returnKm !== "number") return null;
  const difference = returnKm - pickupKm;
  return difference >= 0 ? difference : null;
};

const maybeEmbedImage = async (pdfDoc: PDFDocument, filePath?: string | null): Promise<PDFImage | null> => {
  if (!filePath) return null;
  try {
    const absolutePath = path.resolve(process.cwd(), filePath);
    const image = await fs.readFile(absolutePath);
    const extension = path.extname(filePath).toLowerCase();
    if (extension === ".png") return pdfDoc.embedPng(image);
    if (extension === ".jpg" || extension === ".jpeg") return pdfDoc.embedJpg(image);
  } catch {
    // Missing optional branding must not block contract generation.
  }
  return null;
};

const maybeEmbedFirstImage = async (pdfDoc: PDFDocument, candidates: string[]): Promise<PDFImage | null> => {
  for (const candidate of candidates) {
    const image = await maybeEmbedImage(pdfDoc, candidate);
    if (image) return image;
  }
  return null;
};

const drawRightAligned = (
  page: PDFPage,
  text: string,
  rightX: number,
  y: number,
  font: PDFFont,
  size: number,
  color = COLORS.text
) => {
  page.drawText(text, {
    x: rightX - font.widthOfTextAtSize(text, size),
    y,
    size,
    font,
    color
  });
};

const looksLikeHeading = (line: string) => {
  const normalized = line.trim();
  if (!normalized || normalized.length > 120) return false;
  if (/^(?:art\.?\s*)?\d+(?:\.\d+)*(?:[.)])?\s+/i.test(normalized)) return true;
  return /[A-Z]/.test(normalized) && normalized === normalized.toUpperCase();
};

const isSignaturePlaceholder = (line: string) => {
  const normalized = line.trim().toLowerCase();
  return normalized.startsWith("firma cliente")
    || normalized.startsWith("firma operatore")
    || normalized.startsWith("luogo e data")
    || normalized === "data";
};

export const buildProfessionalContractPdf = async (input: EnterpriseContractPdfInput): Promise<Buffer> => {
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const primary = pdfRgbFromHex(sanitizePdfHex(input.branding?.brandPrimary, "#102a56"));
  const accent = pdfRgbFromHex(sanitizePdfHex(input.branding?.brandPrimary, "#102a56"));

  const companyName = asText(input.branding?.companyName, "Societa di noleggio");
  const companyAddress = asText(input.branding?.companyAddress, "");
  const companyVat = asText(input.branding?.companyVat, "");
  const companyEmail = asText(input.branding?.companyEmail, "");
  const companyPhone = asText(input.branding?.companyPhone, "");
  const tenantLogo = await maybeEmbedImage(pdfDoc, input.branding?.logoFilePath);
  const signatureImage = await maybeEmbedImage(pdfDoc, input.contract.signatureFilePath);
  const fleetumMark = await maybeEmbedFirstImage(pdfDoc, [
    "frontend/public/brand/fleetum-favicon.png",
    "../frontend/public/brand/fleetum-favicon.png",
    "../../frontend/public/brand/fleetum-favicon.png"
  ]);
  const pages: PDFPage[] = [];
  let page!: PDFPage;
  let cursorY = 0;

  const contractDate = input.contract.signedAt
    ?? input.booking.contractSignedAt
    ?? input.contract.updatedAt
    ?? input.contract.createdAt;
  const contractStatus = labelOf(CONTRACT_STATUS_LABELS, input.contract.status ?? input.booking.contractStatus);

  const drawTenantIdentity = (target: PDFPage) => {
    if (tenantLogo) {
      const fitted = containPdfImage(tenantLogo, { x: MARGIN, y: PAGE_H - 60, width: 118, height: 24 });
      target.drawImage(tenantLogo, { ...fitted, x: MARGIN });
    } else {
      target.drawText(companyName, {
        x: MARGIN,
        y: PAGE_H - 51,
        size: 10.8,
        font: bold,
        color: COLORS.ink
      });
    }

    const legalLine = compact(companyAddress, companyVat);
    if (legalLine) {
      const line = wrapPdfText(legalLine, 235, regular, 6.3)[0] ?? legalLine;
      target.drawText(line, { x: MARGIN, y: PAGE_H - 84, size: 6.3, font: regular, color: COLORS.muted });
    }
  };

  const drawHeader = (target: PDFPage, pageNumber: number) => {
    drawTenantIdentity(target);
    drawRightAligned(target, "CONTRATTO DI NOLEGGIO", PAGE_W - MARGIN, PAGE_H - 48, bold, 7.2, COLORS.text);
    drawRightAligned(target, `N. ${asText(input.booking.code)}`, PAGE_W - MARGIN, PAGE_H - 62, bold, 9, COLORS.ink);
    drawRightAligned(target, `Data ${formatDate(contractDate)}`, PAGE_W - MARGIN, PAGE_H - 75, regular, 6.6, COLORS.muted);
    if (pageNumber === 1) {
      drawRightAligned(target, `Template versione ${input.contract.templateVersion ?? "-"} | ${contractStatus}`, PAGE_W - MARGIN, PAGE_H - 87, regular, 6.3, COLORS.muted);
    } else {
      drawRightAligned(target, `Pagina ${pageNumber}`, PAGE_W - MARGIN, PAGE_H - 87, regular, 6.3, COLORS.muted);
    }
    target.drawLine({
      start: { x: MARGIN, y: PAGE_H - 98 },
      end: { x: PAGE_W - MARGIN, y: PAGE_H - 98 },
      thickness: 0.8,
      color: primary
    });
  };

  const drawFooter = (target: PDFPage, pageNumber: number, totalPages: number) => {
    target.drawLine({
      start: { x: MARGIN, y: FOOTER_Y + 12 },
      end: { x: PAGE_W - MARGIN, y: FOOTER_Y + 12 },
      thickness: 0.45,
      color: COLORS.line
    });
    const identity = compact(companyName, companyVat);
    target.drawText(wrapPdfText(identity, 230, regular, 6.4)[0] ?? companyName, {
      x: MARGIN,
      y: FOOTER_Y - 2,
      size: 6.4,
      font: regular,
      color: COLORS.muted
    });
    drawRightAligned(target, `Pagina ${pageNumber} di ${totalPages}`, PAGE_W / 2 + 30, FOOTER_Y - 2, regular, 6.4, COLORS.muted);

    const powered = "Powered by Fleetum";
    const poweredWidth = regular.widthOfTextAtSize(powered, 6.4);
    const poweredX = PAGE_W - MARGIN - poweredWidth;
    if (fleetumMark) {
      const targetHeight = 7;
      const scale = targetHeight / fleetumMark.height;
      target.drawImage(fleetumMark, {
        x: poweredX - fleetumMark.width * scale - 4,
        y: FOOTER_Y - 3,
        width: fleetumMark.width * scale,
        height: targetHeight
      });
    }
    target.drawText(powered, {
      x: poweredX,
      y: FOOTER_Y - 2,
      size: 6.4,
      font: regular,
      color: COLORS.muted
    });
  };

  const newPage = () => {
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    pages.push(page);
    drawHeader(page, pages.length);
    cursorY = PAGE_H - 121;
  };

  const ensureSpace = (height: number) => {
    if (cursorY - height >= CONTENT_BOTTOM) return;
    newPage();
  };

  const drawSectionLabel = (title: string, y = cursorY) => {
    page.drawText(title.toUpperCase(), {
      x: MARGIN,
      y,
      size: 6.8,
      font: bold,
      color: accent
    });
    return y - 18;
  };

  const drawFieldColumn = (x: number, width: number, topY: number, fields: Field[]) => {
    let y = topY;
    for (const field of fields) {
      page.drawText(field.label.toUpperCase(), {
        x,
        y,
        size: 5.8,
        font: bold,
        color: COLORS.muted
      });
      y -= 11;
      const valueLines = wrapPdfText(asText(field.value), width, field.emphasize ? bold : regular, 7.8).slice(0, 2);
      for (const line of valueLines) {
        page.drawText(line, {
          x,
          y,
          size: 7.8,
          font: field.emphasize ? bold : regular,
          color: field.emphasize ? COLORS.ink : COLORS.text
        });
        y -= 9;
      }
      y -= 7;
    }
    return y;
  };

  const drawGridFields = (fields: Field[], columns: number, topY: number, rowHeight: number) => {
    const gap = 20;
    const width = (CONTENT_W - gap * (columns - 1)) / columns;
    fields.forEach((field, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = MARGIN + column * (width + gap);
      const y = topY - row * rowHeight;
      page.drawText(field.label.toUpperCase(), { x, y, size: 5.8, font: bold, color: COLORS.muted });
      const lines = wrapPdfText(asText(field.value), width, field.emphasize ? bold : regular, 7.8).slice(0, 2);
      lines.forEach((line, lineIndex) => {
        page.drawText(line, {
          x,
          y: y - 13 - lineIndex * 9,
          size: 7.8,
          font: field.emphasize ? bold : regular,
          color: field.emphasize ? COLORS.ink : COLORS.text
        });
      });
    });
  };

  const companyCustomer = input.booking.customer?.customerType === "PERSONA_GIURIDICA";
  const legalRep = compact(input.booking.customer?.legalRepFirstName, input.booking.customer?.legalRepLastName);
  const customerFields: Field[] = companyCustomer
    ? [
        { label: "Ragione sociale", value: asText(input.booking.customer?.companyName, input.booking.customerName), emphasize: true },
        { label: "P.IVA / CF", value: compact(input.booking.customer?.companyVatNumber, input.booking.customer?.companyTaxCode) },
        { label: "Sede legale", value: asText(input.booking.customer?.companyLegalAddress) },
        { label: "PEC / SDI", value: compact(input.booking.customer?.companyPec, input.booking.customer?.companySdi) },
        { label: "Legale rappresentante", value: compact(legalRep, input.booking.customer?.legalRepRole) },
        { label: "Contatti", value: compact(input.booking.customer?.legalRepEmail, input.booking.customer?.legalRepPhone) }
      ]
    : [
        { label: "Nominativo", value: fullCustomerName(input.booking), emphasize: true },
        { label: "Codice fiscale", value: asText(input.booking.customer?.taxCode) },
        { label: "Data e luogo di nascita", value: compact(formatDate(input.booking.customer?.dateOfBirth), input.booking.customer?.placeOfBirth) },
        { label: "Residenza", value: asText(input.booking.customer?.residenceAddress) },
        { label: "Documento", value: compact(input.booking.customer?.documentType, input.booking.customer?.documentNumber, `scad. ${formatDate(input.booking.customer?.documentExpiresAt)}`) },
        { label: "Patente", value: compact(input.booking.customer?.drivingLicenseNumber, `cat. ${asText(input.booking.customer?.drivingLicenseCategory)}`, `scad. ${formatDate(input.booking.customer?.drivingLicenseExpiresAt)}`) },
        { label: "Contatti", value: compact(input.booking.customerEmail, input.booking.customerPhone) }
      ];

  const lessorFields: Field[] = [
    { label: "Societa", value: companyName, emphasize: true },
    { label: "Sede legale", value: companyAddress },
    { label: "P.IVA", value: companyVat },
    { label: "Email", value: companyEmail },
    { label: "Telefono", value: companyPhone }
  ];

  const travelledKm = kmTravelled(input.booking.pickupKm, input.booking.returnKm);
  const vehicleFields: Field[] = [
    {
      label: "Veicolo",
      value: compact(input.booking.vehicle?.brand, input.booking.vehicle?.model),
      emphasize: true
    },
    { label: "Targa", value: asText(input.booking.vehicle?.plate), emphasize: true },
    { label: "Codice contratto", value: asText(input.booking.code) },
    { label: "Uscita", value: compact(formatDateTime(input.booking.pickupAt), input.booking.pickupLocation) },
    { label: "Rientro", value: compact(formatDateTime(input.booking.returnAt), input.booking.returnLocation) },
    {
      label: "Percorrenza",
      value: `${formatNumber(input.booking.pickupKm)} uscita | ${formatNumber(input.booking.returnKm)} rientro | ${formatNumber(travelledKm)} km`
    }
  ];

  const snapshot = input.booking.pricingSnapshot;
  const economicRows = [
    ["Listino applicato", asText(snapshot?.priceListName), `${formatMoney(snapshot?.baseRateAmount)} / ${labelOf(BASE_RATE_UNIT_LABELS, snapshot?.baseRateUnit)}`],
    ["Pacchetto km", asText(snapshot?.pricePackageName), `${formatNumber(snapshot?.includedKmTotal)} km inclusi`],
    ["Extra km", asText(snapshot?.extraKmPolicyName), `${formatNumber(snapshot?.extraKmActual ?? snapshot?.extraKmEstimated)} km`],
    ["Totale previsto", "IVA inclusa salvo extra, danni o rettifiche", formatMoney(snapshot?.expectedTotal ?? input.booking.expectedTotal)],
    ["Totale finale", "Valore consuntivo se disponibile", formatMoney(snapshot?.finalTotal ?? input.booking.finalTotal)]
  ] as const;

  newPage();
  cursorY = drawSectionLabel("Parti", PAGE_H - 122);
  const partyGap = 28;
  const partyWidth = (CONTENT_W - partyGap) / 2;
  const lessorBottom = drawFieldColumn(MARGIN, partyWidth, cursorY, lessorFields);
  const customerBottom = drawFieldColumn(MARGIN + partyWidth + partyGap, partyWidth, cursorY, customerFields);
  cursorY = Math.min(lessorBottom, customerBottom) + 2;
  page.drawLine({ start: { x: MARGIN, y: cursorY }, end: { x: PAGE_W - MARGIN, y: cursorY }, thickness: 0.5, color: COLORS.line });
  cursorY -= 20;

  cursorY = drawSectionLabel("Veicolo e periodo di noleggio");
  drawGridFields(vehicleFields, 3, cursorY, 45);
  cursorY -= 94;
  page.drawLine({ start: { x: MARGIN, y: cursorY }, end: { x: PAGE_W - MARGIN, y: cursorY }, thickness: 0.5, color: COLORS.line });
  cursorY -= 20;

  cursorY = drawSectionLabel("Condizioni economiche");
  page.drawText("VOCE", { x: MARGIN, y: cursorY, size: 5.8, font: bold, color: COLORS.muted });
  page.drawText("DETTAGLIO", { x: MARGIN + 138, y: cursorY, size: 5.8, font: bold, color: COLORS.muted });
  drawRightAligned(page, "IMPORTO / REGOLA", PAGE_W - MARGIN, cursorY, bold, 5.8, COLORS.muted);
  cursorY -= 13;
  page.drawLine({ start: { x: MARGIN, y: cursorY + 5 }, end: { x: PAGE_W - MARGIN, y: cursorY + 5 }, thickness: 0.55, color: COLORS.line });
  economicRows.forEach(([label, detail, amount], index) => {
    const strong = index >= economicRows.length - 2;
    page.drawText(label, { x: MARGIN, y: cursorY - 8, size: 7.5, font: strong ? bold : regular, color: COLORS.text });
    page.drawText(wrapPdfText(detail, 206, regular, 7)[0] ?? detail, { x: MARGIN + 138, y: cursorY - 8, size: 7, font: regular, color: COLORS.muted });
    drawRightAligned(page, amount, PAGE_W - MARGIN, cursorY - 8, strong ? bold : regular, strong ? 7.8 : 7.3, strong ? primary : COLORS.text);
    cursorY -= 19;
    page.drawLine({ start: { x: MARGIN, y: cursorY + 5 }, end: { x: PAGE_W - MARGIN, y: cursorY + 5 }, thickness: 0.4, color: COLORS.lineLight });
  });

  cursorY -= 7;
  page.drawText("NOTE", { x: MARGIN, y: cursorY, size: 6.2, font: bold, color: accent });
  cursorY -= 14;
  const noteText = asText(snapshot?.notes, asText(input.contract.title, "Contratto di noleggio senza conducente"));
  for (const line of wrapPdfText(noteText, CONTENT_W, regular, 7.1).slice(0, 3)) {
    page.drawText(line, { x: MARGIN, y: cursorY, size: 7.1, font: regular, color: COLORS.text });
    cursorY -= 9;
  }
  cursorY -= 5;
  page.drawText(
    `Prenotazione ${labelOf(BOOKING_STATUS_LABELS, input.booking.status)} | Contratto ${contractStatus}`,
    { x: MARGIN, y: cursorY, size: 6.4, font: regular, color: COLORS.muted }
  );

  newPage();
  const sourceLines = input.contract.content
    .replace(/\r/g, "")
    .split("\n");

  for (const sourceLine of sourceLines) {
    const line = sourceLine.trim();
    if (!line) {
      cursorY -= 6;
      continue;
    }
    if (/^CONTRATTO DI NOLEGGIO/i.test(line) || isSignaturePlaceholder(line)) continue;

    if (looksLikeHeading(line)) {
      ensureSpace(30);
      page.drawText(line.toUpperCase(), {
        x: MARGIN,
        y: cursorY,
        size: 7.7,
        font: bold,
        color: accent
      });
      cursorY -= 11;
      page.drawLine({ start: { x: MARGIN, y: cursorY + 4 }, end: { x: PAGE_W - MARGIN, y: cursorY + 4 }, thickness: 0.45, color: COLORS.line });
      cursorY -= 10;
      continue;
    }

    const bullet = /^[-*]\s+/.test(line);
    const cleanLine = bullet ? line.replace(/^[-*]\s+/, "") : line;
    const paragraphX = MARGIN + (bullet ? 12 : 0);
    const paragraphWidth = CONTENT_W - (bullet ? 12 : 0);
    const wrapped = wrapPdfText(cleanLine, paragraphWidth, regular, 7.8);
    for (let index = 0; index < wrapped.length; index += 1) {
      ensureSpace(12);
      if (bullet && index === 0) {
        page.drawText("-", { x: MARGIN, y: cursorY, size: 7.8, font: bold, color: COLORS.text });
      }
      page.drawText(wrapped[index], {
        x: paragraphX,
        y: cursorY,
        size: 7.8,
        font: regular,
        color: COLORS.text
      });
      cursorY -= 10.5;
    }
    cursorY -= 5;
  }

  ensureSpace(142);
  page.drawLine({ start: { x: MARGIN, y: cursorY + 6 }, end: { x: PAGE_W - MARGIN, y: cursorY + 6 }, thickness: 0.55, color: primary });
  cursorY -= 10;
  page.drawText("FIRME", { x: MARGIN, y: cursorY, size: 6.8, font: bold, color: accent });
  cursorY -= 23;
  const signatureStatement = "Le parti dichiarano di avere letto, compreso e accettato il presente contratto e le condizioni richiamate.";
  for (const line of wrapPdfText(signatureStatement, CONTENT_W, regular, 7.5)) {
    page.drawText(line, { x: MARGIN, y: cursorY, size: 7.5, font: regular, color: COLORS.text });
    cursorY -= 9;
  }
  cursorY -= 18;

  const signatureGap = 42;
  const signatureWidth = (CONTENT_W - signatureGap) / 2;
  const leftX = MARGIN;
  const rightX = MARGIN + signatureWidth + signatureGap;
  page.drawText("PER IL LOCATORE", { x: leftX, y: cursorY, size: 6.2, font: bold, color: COLORS.muted });
  page.drawText(companyName, { x: leftX, y: cursorY - 15, size: 7.5, font: bold, color: COLORS.text });
  page.drawText("PER IL CONDUCENTE", { x: rightX, y: cursorY, size: 6.2, font: bold, color: COLORS.muted });
  page.drawText(fullCustomerName(input.booking), { x: rightX, y: cursorY - 15, size: 7.5, font: bold, color: COLORS.text });

  const lineY = cursorY - 67;
  page.drawLine({ start: { x: leftX, y: lineY }, end: { x: leftX + signatureWidth, y: lineY }, thickness: 0.5, color: COLORS.line });
  page.drawLine({ start: { x: rightX, y: lineY }, end: { x: rightX + signatureWidth, y: lineY }, thickness: 0.5, color: COLORS.line });
  if (signatureImage) {
    const fitted = containPdfImage(signatureImage, { x: rightX, y: lineY + 6, width: signatureWidth, height: 42 });
    page.drawImage(signatureImage, fitted);
  }
  page.drawText(compact("Roma", formatDate(contractDate)), { x: leftX, y: lineY - 14, size: 6.4, font: regular, color: COLORS.muted });
  page.drawText(compact("Roma", formatDate(contractDate)), { x: rightX, y: lineY - 14, size: 6.4, font: regular, color: COLORS.muted });

  const totalPages = pages.length;
  pages.forEach((entry, index) => drawFooter(entry, index + 1, totalPages));
  return Buffer.from(await pdfDoc.save());
};
