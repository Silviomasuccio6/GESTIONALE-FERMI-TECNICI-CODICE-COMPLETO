import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import type { SaasInvoicePdfInput } from "./saas-invoice-pdf-service.js";
import {
  A4_PAGE_HEIGHT,
  A4_PAGE_WIDTH,
  containPdfImage,
  normalizePdfText,
  wrapPdfText
} from "./pdf-document-design-system.js";

const PAGE_W = A4_PAGE_WIDTH;
const PAGE_H = A4_PAGE_HEIGHT;
const MARGIN = 44;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_Y = 38;
const CONTENT_BOTTOM = 72;
const HEADER_RULE_Y = PAGE_H - 92;
const PARTY_LABEL_Y = 716;
const PARTY_NAME_Y = 695;
const PARTY_DETAILS_Y = 675;
const PARTY_BOTTOM_Y = 616;
const META_TOP_Y = 602;
const META_BOTTOM_Y = 550;
const TABLE_HEADER_Y = 524;

const COLORS = {
  ink: rgb(0.035, 0.055, 0.09),
  text: rgb(0.08, 0.105, 0.15),
  muted: rgb(0.35, 0.4, 0.49),
  line: rgb(0.77, 0.81, 0.87),
  lineLight: rgb(0.88, 0.9, 0.93),
  navy: rgb(0.055, 0.14, 0.31),
  blue: rgb(0.07, 0.29, 0.78),
  success: rgb(0.04, 0.46, 0.24),
  danger: rgb(0.7, 0.12, 0.16)
} as const;

const formatMoney = (value: number, currency = "EUR") =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);

const formatDate = (value: Date | string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("it-IT");
};

const compact = (...values: Array<string | null | undefined>) =>
  values
    .map((value) => normalizePdfText(value, ""))
    .filter(Boolean)
    .join(" | ");

const formatIban = (value: string) => {
  const normalized = normalizePdfText(value);
  return /^IBAN\b/i.test(normalized) ? normalized : `IBAN ${normalized}`;
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

const drawRule = (page: PDFPage, y: number, color = COLORS.line, thickness = 0.55) => {
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness,
    color
  });
};

const resolveLogo = async (pdfDoc: PDFDocument, candidates: string[]): Promise<PDFImage | null> => {
  for (const candidate of candidates) {
    try {
      const image = await fs.readFile(path.resolve(process.cwd(), candidate));
      const extension = path.extname(candidate).toLowerCase();
      if (extension === ".jpg" || extension === ".jpeg") return pdfDoc.embedJpg(image);
      if (extension === ".png") return pdfDoc.embedPng(image);
    } catch {
      // Runtime images can use a different working directory.
    }
  }
  return null;
};

const statusPresentation = (status: string) => {
  const normalized = status.toUpperCase();
  const labels: Record<string, string> = {
    DRAFT: "BOZZA",
    GENERATED: "GENERATA",
    SENT: "INVIATA",
    PAID: "PAGATA",
    OVERDUE: "SCADUTA",
    VOID: "ANNULLATA",
    ERROR: "ERRORE"
  };
  const color = normalized === "PAID"
    ? COLORS.success
    : normalized === "OVERDUE" || normalized === "ERROR"
      ? COLORS.danger
      : COLORS.blue;
  return { label: labels[normalized] ?? normalized.replace(/_/g, " "), color };
};

export const buildProfessionalSaasInvoicePdf = async (input: SaasInvoicePdfInput): Promise<Buffer> => {
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const logo = await resolveLogo(pdfDoc, input.logoFilePaths ?? [
    "assets/fleetum-logo-horizontal.png",
    "backend/assets/fleetum-logo-horizontal.png",
    "../backend/assets/fleetum-logo-horizontal.png",
    "frontend/public/brand/fleetum-logo-horizontal.png"
  ]);
  const pages: PDFPage[] = [];
  const status = statusPresentation(input.status);

  const drawLogo = (page: PDFPage) => {
    if (logo) {
      const fitted = containPdfImage(logo, { x: MARGIN, y: PAGE_H - 68, width: 118, height: 30 });
      page.drawImage(logo, { ...fitted, x: MARGIN });
      return;
    }
    page.drawText("FLEETUM", {
      x: MARGIN,
      y: PAGE_H - 55,
      size: 12,
      font: bold,
      color: COLORS.ink
    });
  };

  const drawHeader = (page: PDFPage, continuation = false) => {
    drawLogo(page);
    drawRightAligned(page, continuation ? "FATTURA - DETTAGLIO" : "FATTURA", PAGE_W - MARGIN, PAGE_H - 49, bold, 12, COLORS.ink);
    drawRightAligned(page, input.invoiceNumber, PAGE_W - MARGIN, PAGE_H - 65, bold, 9.2, COLORS.ink);
    drawRightAligned(page, `Data ${formatDate(input.issueDate)}`, PAGE_W - MARGIN, PAGE_H - 78, regular, 7.1, COLORS.muted);
    drawRule(page, HEADER_RULE_Y, COLORS.navy, 0.8);
  };

  const drawFooter = (page: PDFPage, pageNumber: number, totalPages: number) => {
    drawRule(page, FOOTER_Y + 12, COLORS.line, 0.45);
    page.drawText("Documento generato da Fleetum Billing. COPIA DI CORTESIA; non sostituisce un documento fiscale SDI.", {
      x: MARGIN,
      y: FOOTER_Y - 2,
      size: 6.4,
      font: regular,
      color: COLORS.muted
    });
    drawRightAligned(page, `Pagina ${pageNumber} di ${totalPages}`, PAGE_W - MARGIN, FOOTER_Y - 2, regular, 6.4, COLORS.muted);
  };

  const drawParty = (page: PDFPage, x: number, width: number, label: string, name: string, lines: string[]) => {
    page.drawText(label.toUpperCase(), { x, y: PARTY_LABEL_Y, size: 6.8, font: bold, color: COLORS.navy });
    const nameLines = wrapPdfText(normalizePdfText(name), width, bold, 9.2).slice(0, 2);
    let nameY = PARTY_NAME_Y;
    for (const line of nameLines) {
      page.drawText(line, { x, y: nameY, size: 9.2, font: bold, color: COLORS.ink });
      nameY -= 11;
    }
    let detailY = PARTY_DETAILS_Y;
    const detailLines = lines
      .filter(Boolean)
      .flatMap((line) => wrapPdfText(line, width, regular, 7.1));
    for (const line of detailLines.slice(0, 7)) {
      page.drawText(line, { x, y: detailY, size: 7.1, font: regular, color: COLORS.text });
      detailY -= 9.5;
    }
  };

  const drawMetaRow = (page: PDFPage) => {
    drawRule(page, META_TOP_Y, COLORS.line, 0.55);
    const entries = [
      ["DATA EMISSIONE", formatDate(input.issueDate), MARGIN],
      ["DATA SCADENZA", formatDate(input.dueDate), MARGIN + 102],
      ["PERIODO", `${formatDate(input.periodStart)} - ${formatDate(input.periodEnd)}`, MARGIN + 208],
      ["STATO", status.label, PAGE_W - MARGIN - 94]
    ] as const;
    entries.forEach(([label, value, x], index) => {
      page.drawText(label, { x, y: META_TOP_Y - 16, size: 6.3, font: bold, color: COLORS.muted });
      page.drawText(value, {
        x,
        y: META_TOP_Y - 34,
        size: 7.7,
        font: index === 3 ? bold : regular,
        color: index === 3 ? status.color : COLORS.text
      });
    });
    drawRule(page, META_BOTTOM_Y, COLORS.line, 0.55);
  };

  const drawTableHeader = (page: PDFPage, y: number) => {
    drawRule(page, y + 8, COLORS.navy, 0.75);
    page.drawText("DESCRIZIONE", { x: MARGIN, y: y - 5, size: 6.4, font: bold, color: COLORS.text });
    drawRightAligned(page, "Q.TA", 373, y - 5, bold, 6.4, COLORS.text);
    drawRightAligned(page, "PREZZO UNIT.", 472, y - 5, bold, 6.4, COLORS.text);
    drawRightAligned(page, "IMPORTO", PAGE_W - MARGIN, y - 5, bold, 6.4, COLORS.text);
    drawRule(page, y - 16, COLORS.line, 0.55);
    return y - 34;
  };

  const addContinuationPage = () => {
    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    pages.push(page);
    drawHeader(page, true);
    return { page, cursorY: drawTableHeader(page, PAGE_H - 122) };
  };

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  pages.push(page);
  drawHeader(page);

  const partyGap = 28;
  const partyWidth = (CONTENT_W - partyGap) / 2;
  drawParty(
    page,
    MARGIN,
    partyWidth,
    "Emittente",
    normalizePdfText(input.issuer.name, "Fleetum"),
    [
      normalizePdfText(input.issuer.address, ""),
      input.issuer.vat ? `P.IVA ${normalizePdfText(input.issuer.vat, "").replace(/^P\.IVA\s*/i, "")}` : "",
      normalizePdfText(input.issuer.email, ""),
      normalizePdfText(input.issuer.website, ""),
      input.issuer.pec ? `PEC ${input.issuer.pec}` : "",
      input.issuer.sdi ? `SDI ${input.issuer.sdi}` : ""
    ]
  );
  drawParty(
    page,
    MARGIN + partyWidth + partyGap,
    partyWidth,
    "Cliente",
    normalizePdfText(input.billingName),
    [
      normalizePdfText(input.billingAddress, ""),
      input.billingVatNumber ? `P.IVA ${input.billingVatNumber}` : "",
      input.billingTaxCode ? `CF ${input.billingTaxCode}` : "",
      normalizePdfText(input.billingEmail, ""),
      input.billingPec ? `PEC ${input.billingPec}` : "",
      input.billingSdi ? `SDI ${input.billingSdi}` : ""
    ]
  );
  page.drawLine({
    start: { x: PAGE_W / 2, y: PARTY_BOTTOM_Y },
    end: { x: PAGE_W / 2, y: PARTY_LABEL_Y },
    thickness: 0.45,
    color: COLORS.lineLight
  });
  drawMetaRow(page);

  let cursorY = drawTableHeader(page, TABLE_HEADER_Y);
  const summaryHeight = 126;

  for (let index = 0; index < input.items.length; index += 1) {
    const item = input.items[index];
    const descriptionLines = wrapPdfText(normalizePdfText(item.description), 292, regular, 7.6);
    const rowHeight = Math.max(28, descriptionLines.length * 9.5 + 15);
    const isLast = index === input.items.length - 1;
    const requiredBottom = isLast ? CONTENT_BOTTOM + summaryHeight : CONTENT_BOTTOM;

    if (cursorY - rowHeight < requiredBottom) {
      const continuation = addContinuationPage();
      page = continuation.page;
      cursorY = continuation.cursorY;
    }

    const rowTextY = cursorY - 1;
    let textY = rowTextY;
    for (const line of descriptionLines) {
      page.drawText(line, { x: MARGIN, y: textY, size: 7.6, font: regular, color: COLORS.text });
      textY -= 9.5;
    }
    drawRightAligned(page, String(item.quantity), 373, rowTextY, regular, 7.6);
    drawRightAligned(page, formatMoney(item.unitPrice, input.currency), 472, rowTextY, regular, 7.6);
    drawRightAligned(page, formatMoney(item.total, input.currency), PAGE_W - MARGIN, rowTextY, regular, 7.6);
    cursorY -= rowHeight;
    drawRule(page, cursorY + 7, COLORS.lineLight, 0.4);
  }

  if (cursorY - summaryHeight < CONTENT_BOTTOM) {
    const continuation = addContinuationPage();
    page = continuation.page;
    cursorY = continuation.cursorY;
  }

  const summaryRuleY = cursorY - 8;
  const summaryContentY = summaryRuleY - 14;
  const summaryX = PAGE_W - MARGIN - 190;
  const notesWidth = summaryX - MARGIN - 34;

  page.drawText("INFORMAZIONI DI PAGAMENTO", {
    x: MARGIN,
    y: summaryContentY,
    size: 6.5,
    font: bold,
    color: COLORS.navy
  });
  const paymentText = compact(
    input.issuer.iban ? formatIban(input.issuer.iban) : "Pagamento secondo gli accordi contrattuali",
    input.notes
  );
  let noteY = summaryContentY - 21;
  for (const line of wrapPdfText(paymentText, notesWidth, regular, 7.2).slice(0, 6)) {
    page.drawText(line, { x: MARGIN, y: noteY, size: 7.2, font: regular, color: COLORS.text });
    noteY -= 10;
  }

  drawRule(page, summaryRuleY, COLORS.navy, 0.75);

  const subtotalY = summaryContentY;
  const taxY = subtotalY - 21;
  const totalRuleY = taxY - 12;
  const totalY = totalRuleY - 19;

  page.drawText("IMPONIBILE", { x: summaryX, y: subtotalY, size: 7.2, font: regular, color: COLORS.text });
  drawRightAligned(page, formatMoney(input.subtotal, input.currency), PAGE_W - MARGIN, subtotalY, regular, 7.6, COLORS.text);
  page.drawText(`IVA ${new Intl.NumberFormat("it-IT", { maximumFractionDigits: 2 }).format(input.taxRate)}%`, {
    x: summaryX,
    y: taxY,
    size: 7.2,
    font: regular,
    color: COLORS.text
  });
  drawRightAligned(page, formatMoney(input.taxAmount, input.currency), PAGE_W - MARGIN, taxY, regular, 7.6, COLORS.text);
  page.drawLine({
    start: { x: summaryX, y: totalRuleY },
    end: { x: PAGE_W - MARGIN, y: totalRuleY },
    thickness: 0.65,
    color: COLORS.line
  });
  page.drawText("Totale", { x: summaryX, y: totalY, size: 8.5, font: bold, color: COLORS.ink });
  drawRightAligned(page, formatMoney(input.total, input.currency), PAGE_W - MARGIN, totalY, bold, 10.5, COLORS.navy);

  const totalPages = pages.length;
  pages.forEach((entry, index) => drawFooter(entry, index + 1, totalPages));
  return Buffer.from(await pdfDoc.save());
};
