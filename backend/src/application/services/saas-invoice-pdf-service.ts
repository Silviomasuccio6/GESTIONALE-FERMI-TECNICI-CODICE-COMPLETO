import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import {
  A4_PAGE_HEIGHT,
  A4_PAGE_WIDTH,
  PDF_COLORS,
  containPdfImage,
  drawPdfText,
  normalizePdfText,
  wrapPdfText
} from "./pdf-document-design-system.js";
import { buildProfessionalSaasInvoicePdf } from "./professional-saas-invoice-pdf-renderer.js";

export type SaasInvoicePdfInput = {
  invoiceNumber: string;
  issueDate: Date | string;
  dueDate: Date | string;
  periodStart: Date | string;
  periodEnd: Date | string;
  status: string;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  billingName: string;
  billingVatNumber?: string | null;
  billingTaxCode?: string | null;
  billingAddress?: string | null;
  billingEmail?: string | null;
  billingPec?: string | null;
  billingSdi?: string | null;
  notes?: string | null;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  issuer: {
    name: string;
    vat?: string | null;
    address?: string | null;
    email?: string | null;
    pec?: string | null;
    sdi?: string | null;
    iban?: string | null;
    website?: string | null;
  };
  logoFilePaths?: string[];
};

const PAGE_W = A4_PAGE_WIDTH;
const PAGE_H = A4_PAGE_HEIGHT;
const MARGIN = 44;
const CONTENT_WIDTH = PAGE_W - MARGIN * 2;
const CONTENT_BOTTOM = 94;
const BLUE = rgb(0.12, 0.32, 0.92);
const BLUE_DARK = rgb(0.055, 0.16, 0.44);
const BLUE_SOFT = rgb(0.94, 0.965, 1);

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
    .join(" · ");

const drawRightAligned = (
  page: PDFPage,
  text: string,
  rightX: number,
  y: number,
  font: PDFFont,
  size: number,
  color = PDF_COLORS.text
) => {
  page.drawText(text, {
    x: rightX - font.widthOfTextAtSize(text, size),
    y,
    size,
    font,
    color
  });
};

const resolveLogo = async (pdfDoc: PDFDocument, candidates: string[]): Promise<PDFImage | null> => {
  for (const candidate of candidates) {
    try {
      const image = await fs.readFile(path.resolve(process.cwd(), candidate));
      const extension = path.extname(candidate).toLowerCase();
      if (extension === ".jpg" || extension === ".jpeg") return pdfDoc.embedJpg(image);
      return pdfDoc.embedPng(image);
    } catch {
      // Runtime images can use a different working directory from local development.
    }
  }
  return null;
};

const invoiceStatus = (status: string) => {
  const normalized = status.toUpperCase();
  const labels: Record<string, string> = {
    DRAFT: "Bozza",
    GENERATED: "Generata",
    SENT: "Inviata",
    PAID: "Pagata",
    OVERDUE: "Scaduta",
    VOID: "Annullata",
    ERROR: "Errore"
  };
  const color = normalized === "PAID"
    ? PDF_COLORS.success
    : normalized === "OVERDUE" || normalized === "ERROR"
      ? PDF_COLORS.danger
      : BLUE;
  return { label: labels[normalized] ?? normalized.replace(/_/g, " "), color };
};

const useProfessionalInvoiceRenderer = (): boolean => true;

export const buildSaasInvoicePdf = async (input: SaasInvoicePdfInput): Promise<Buffer> => {
  if (useProfessionalInvoiceRenderer()) {
    return buildProfessionalSaasInvoicePdf(input);
  }

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
  let page: PDFPage;
  let cursorY = 0;

  const drawFooter = (target: PDFPage, pageNumber: number, totalPages: number) => {
    target.drawLine({
      start: { x: MARGIN, y: 68 },
      end: { x: PAGE_W - MARGIN, y: 68 },
      thickness: 0.7,
      color: PDF_COLORS.line
    });
    drawPdfText(target, "Documento generato da Fleetum Billing. Copia di cortesia se non integrata a un flusso SDI certificato.", {
      x: MARGIN,
      y: 51,
      maxWidth: 390,
      font: regular,
      fontSize: 7.2,
      lineHeight: 9,
      color: PDF_COLORS.muted,
      maxLines: 2
    });
    drawRightAligned(target, `Pagina ${pageNumber}/${totalPages}`, PAGE_W - MARGIN, 47, regular, 7.4, PDF_COLORS.muted);
  };

  const drawTableHeader = (target: PDFPage, y: number) => {
    target.drawRectangle({ x: MARGIN, y: y - 28, width: CONTENT_WIDTH, height: 28, color: PDF_COLORS.ink });
    target.drawText("Descrizione", { x: MARGIN + 14, y: y - 18, size: 7.7, font: bold, color: PDF_COLORS.white });
    target.drawText("Q.ta", { x: 348, y: y - 18, size: 7.7, font: bold, color: PDF_COLORS.white });
    target.drawText("Prezzo", { x: 398, y: y - 18, size: 7.7, font: bold, color: PDF_COLORS.white });
    target.drawText("Totale", { x: 493, y: y - 18, size: 7.7, font: bold, color: PDF_COLORS.white });
    return y - 42;
  };

  const addContinuationPage = () => {
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    pages.push(page);
    page.drawRectangle({ x: 0, y: PAGE_H - 76, width: PAGE_W, height: 76, color: BLUE_SOFT });
    page.drawRectangle({ x: 0, y: PAGE_H - 3, width: PAGE_W, height: 3, color: BLUE });
    page.drawText("FLEETUM BILLING", { x: MARGIN, y: PAGE_H - 33, size: 7.2, font: bold, color: BLUE });
    page.drawText(`${input.invoiceNumber} · dettaglio`, { x: MARGIN, y: PAGE_H - 54, size: 13, font: bold, color: PDF_COLORS.ink });
    if (logo) page.drawImage(logo, containPdfImage(logo, { x: PAGE_W - MARGIN - 116, y: PAGE_H - 62, width: 116, height: 38 }));
    cursorY = drawTableHeader(page, PAGE_H - 98);
  };

  page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  pages.push(page);
  page.drawRectangle({ x: 0, y: PAGE_H - 150, width: PAGE_W, height: 150, color: BLUE_SOFT });
  page.drawRectangle({ x: 0, y: PAGE_H - 4, width: PAGE_W, height: 4, color: BLUE });
  page.drawText("DOCUMENTO RIEPILOGATIVO / COPIA DI CORTESIA", {
    x: MARGIN,
    y: PAGE_H - 49,
    size: 7.1,
    font: bold,
    color: BLUE
  });
  page.drawText(input.invoiceNumber, { x: MARGIN, y: PAGE_H - 84, size: 24, font: bold, color: PDF_COLORS.ink });
  page.drawText("Fatturazione SaaS Fleetum", { x: MARGIN, y: PAGE_H - 106, size: 10.2, font: regular, color: PDF_COLORS.muted });
  if (logo) {
    page.drawImage(logo, containPdfImage(logo, { x: PAGE_W - MARGIN - 126, y: PAGE_H - 90, width: 126, height: 42 }));
  } else {
    drawRightAligned(page, "Fleetum", PAGE_W - MARGIN, PAGE_H - 70, bold, 18, PDF_COLORS.ink);
  }
  const status = invoiceStatus(input.status);
  const statusWidth = Math.max(82, bold.widthOfTextAtSize(status.label.toUpperCase(), 8) + 28);
  page.drawRectangle({
    x: PAGE_W - MARGIN - statusWidth,
    y: PAGE_H - 128,
    width: statusWidth,
    height: 26,
    borderColor: status.color,
    borderWidth: 0.8,
    color: PDF_COLORS.white,
    opacity: 0.95
  });
  page.drawText(status.label.toUpperCase(), {
    x: PAGE_W - MARGIN - statusWidth + 14,
    y: PAGE_H - 119,
    size: 8,
    font: bold,
    color: status.color
  });

  const metaY = PAGE_H - 181;
  const metaItems = [
    ["DATA EMISSIONE", formatDate(input.issueDate), MARGIN],
    ["DATA SCADENZA", formatDate(input.dueDate), MARGIN + 140],
    ["PERIODO", `${formatDate(input.periodStart)} - ${formatDate(input.periodEnd)}`, MARGIN + 280]
  ] as const;
  for (const [label, value, x] of metaItems) {
    page.drawText(label, { x, y: metaY, size: 7, font: bold, color: PDF_COLORS.muted });
    page.drawText(value, { x, y: metaY - 16, size: 9.4, font: regular, color: PDF_COLORS.text });
  }

  const partiesTop = PAGE_H - 232;
  const partyGap = 14;
  const partyWidth = (CONTENT_WIDTH - partyGap) / 2;
  const partyHeight = 118;
  const drawPartyCard = (x: number, title: string, name: string, lines: string[], warning?: string) => {
    page.drawRectangle({
      x,
      y: partiesTop - partyHeight,
      width: partyWidth,
      height: partyHeight,
      borderColor: PDF_COLORS.line,
      borderWidth: 0.7,
      color: PDF_COLORS.white
    });
    page.drawRectangle({ x, y: partiesTop - partyHeight, width: 3, height: partyHeight, color: BLUE });
    page.drawText(title.toUpperCase(), { x: x + 14, y: partiesTop - 18, size: 7, font: bold, color: PDF_COLORS.muted });
    drawPdfText(page, name, { x: x + 14, y: partiesTop - 38, maxWidth: partyWidth - 28, font: bold, fontSize: 10, lineHeight: 11, color: PDF_COLORS.ink, maxLines: 2 });
    const detailLines = lines
      .filter(Boolean)
      .flatMap((line) => wrapPdfText(line, partyWidth - 28, regular, 7.7));
    const maxDetailLines = warning ? 3 : 5;
    let detailY = partiesTop - 64;
    for (const line of (detailLines.length > 0 ? detailLines : ["-"]).slice(0, maxDetailLines)) {
      page.drawText(line, {
        x: x + 14,
        y: detailY,
        size: 7.7,
        font: regular,
        color: PDF_COLORS.muted
      });
      detailY -= 9;
    }
    if (warning) {
      drawPdfText(page, warning, { x: x + 14, y: partiesTop - 106, maxWidth: partyWidth - 28, font: bold, fontSize: 6.9, lineHeight: 8, color: PDF_COLORS.warning, maxLines: 1 });
    }
  };

  const issuerLines = [
    normalizePdfText(input.issuer.address, ""),
    normalizePdfText(input.issuer.vat, ""),
    compact(input.issuer.email, input.issuer.website),
    compact(input.issuer.pec ? `PEC ${input.issuer.pec}` : "", input.issuer.sdi ? `SDI ${input.issuer.sdi}` : "")
  ].filter(Boolean);
  const issuerIncomplete = !normalizePdfText(input.issuer.address, "") || !normalizePdfText(input.issuer.vat, "");
  drawPartyCard(
    MARGIN,
    "Emittente",
    normalizePdfText(input.issuer.name, "Fleetum"),
    issuerLines,
    issuerIncomplete ? "Dati fiscali emittente da completare nella configurazione Fleetum." : undefined
  );
  drawPartyCard(
    MARGIN + partyWidth + partyGap,
    "Cliente",
    normalizePdfText(input.billingName),
    [
      normalizePdfText(input.billingAddress, ""),
      compact(input.billingVatNumber ? `P.IVA ${input.billingVatNumber}` : "", input.billingTaxCode ? `CF ${input.billingTaxCode}` : ""),
      normalizePdfText(input.billingEmail, ""),
      compact(input.billingPec ? `PEC ${input.billingPec}` : "", input.billingSdi ? `SDI ${input.billingSdi}` : "")
    ].filter(Boolean)
  );

  cursorY = drawTableHeader(page, partiesTop - partyHeight - 24);
  for (const item of input.items) {
    const descriptionLines = wrapPdfText(normalizePdfText(item.description), 274, regular, 8.8);
    const rowHeight = Math.max(34, 14 + descriptionLines.length * 11);
    if (cursorY - rowHeight < CONTENT_BOTTOM) addContinuationPage();

    let descriptionY = cursorY - 3;
    for (const line of descriptionLines) {
      page.drawText(line, { x: MARGIN + 14, y: descriptionY, size: 8.8, font: regular, color: PDF_COLORS.text });
      descriptionY -= 11;
    }
    page.drawText(String(item.quantity), { x: 352, y: cursorY - 3, size: 8.8, font: regular, color: PDF_COLORS.text });
    drawRightAligned(page, formatMoney(item.unitPrice, input.currency), 462, cursorY - 3, regular, 8.8);
    drawRightAligned(page, formatMoney(item.total, input.currency), PAGE_W - MARGIN - 12, cursorY - 3, bold, 8.8);
    page.drawLine({
      start: { x: MARGIN, y: cursorY - rowHeight + 5 },
      end: { x: PAGE_W - MARGIN, y: cursorY - rowHeight + 5 },
      thickness: 0.55,
      color: PDF_COLORS.line
    });
    cursorY -= rowHeight;
  }

  const notesText = compact(
    input.issuer.iban ? `Pagamento secondo accordi contrattuali. IBAN: ${input.issuer.iban}` : "Pagamento secondo accordi contrattuali",
    input.notes
  );
  const notesLines = wrapPdfText(notesText, 280, regular, 8.2);
  const finalHeight = Math.max(150, 76 + notesLines.length * 10);
  if (cursorY - finalHeight < CONTENT_BOTTOM) {
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    pages.push(page);
    page.drawRectangle({ x: 0, y: PAGE_H - 76, width: PAGE_W, height: 76, color: BLUE_SOFT });
    page.drawRectangle({ x: 0, y: PAGE_H - 3, width: PAGE_W, height: 3, color: BLUE });
    page.drawText("FLEETUM BILLING", { x: MARGIN, y: PAGE_H - 33, size: 7.2, font: bold, color: BLUE });
    page.drawText(`${input.invoiceNumber} · riepilogo`, { x: MARGIN, y: PAGE_H - 54, size: 13, font: bold, color: PDF_COLORS.ink });
    if (logo) page.drawImage(logo, containPdfImage(logo, { x: PAGE_W - MARGIN - 116, y: PAGE_H - 62, width: 116, height: 38 }));
    cursorY = PAGE_H - 112;
  }

  page.drawText("NOTE DI PAGAMENTO", { x: MARGIN, y: cursorY - 4, size: 7, font: bold, color: PDF_COLORS.muted });
  drawPdfText(page, notesText, {
    x: MARGIN,
    y: cursorY - 24,
    maxWidth: 278,
    font: regular,
    fontSize: 8.2,
    lineHeight: 10,
    color: PDF_COLORS.muted
  });

  const summaryX = PAGE_W - MARGIN - 210;
  const summaryTop = cursorY + 4;
  page.drawRectangle({
    x: summaryX,
    y: summaryTop - 116,
    width: 210,
    height: 116,
    borderColor: PDF_COLORS.line,
    borderWidth: 0.8,
    color: PDF_COLORS.white
  });
  const summaryRows: Array<[string, string, boolean]> = [
    ["Imponibile", formatMoney(input.subtotal, input.currency), false],
    [`IVA ${input.taxRate}%`, formatMoney(input.taxAmount, input.currency), false],
    ["Totale", formatMoney(input.total, input.currency), true]
  ];
  let summaryY = summaryTop - 24;
  for (const [label, value, strong] of summaryRows) {
    page.drawText(label, { x: summaryX + 16, y: summaryY, size: strong ? 10 : 8.4, font: strong ? bold : regular, color: strong ? PDF_COLORS.ink : PDF_COLORS.muted });
    drawRightAligned(page, value, summaryX + 194, summaryY, bold, strong ? 12 : 8.8, strong ? BLUE_DARK : PDF_COLORS.text);
    if (strong) {
      page.drawLine({ start: { x: summaryX + 16, y: summaryY + 18 }, end: { x: summaryX + 194, y: summaryY + 18 }, thickness: 0.7, color: PDF_COLORS.line });
    }
    summaryY -= strong ? 30 : 24;
  }

  const totalPages = pages.length;
  pages.forEach((entry, index) => drawFooter(entry, index + 1, totalPages));
  return Buffer.from(await pdfDoc.save());
};
