import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument } from "pdf-lib";
import { buildEnterpriseContractPdf } from "../src/application/services/enterprise-contract-pdf-service.js";
import { buildSaasInvoicePdf } from "../src/application/services/saas-invoice-pdf-service.js";

const extractPdfText = async (buffer: Buffer) => {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const parsed = await parser.getText();
    return parsed.text;
  } finally {
    await parser.destroy();
  }
};

test("contract PDF renders the complete versioned contract content across pages", async () => {
  const versionedSections = Array.from({ length: 12 }, (_, index) =>
    [
      `${index + 1}. SEZIONE VERSIONATA ${index + 1}`,
      `CLAUSOLA VERSIONATA UNICA ${index + 1}. Il contenuto contrattuale configurato dal tenant resta la fonte testuale del documento e deve essere leggibile integralmente anche quando richiede piu pagine.`,
      `Ulteriore testo della sezione ${index + 1} per verificare continuita, spaziatura, intestazioni e numerazione del PDF professionale.`
    ].join("\n")
  ).join("\n\n");

  const buffer = await buildEnterpriseContractPdf({
    contract: {
      title: "Contratto di noleggio versionato",
      content: `CONTRATTO DI NOLEGGIO VEICOLO SENZA CONDUCENTE\n\n${versionedSections}`,
      status: "SIGNED",
      templateVersion: 42,
      createdAt: "2026-08-01T09:00:00.000Z",
      signedAt: "2026-08-01T10:00:00.000Z"
    },
    booking: {
      code: "TEST-CONTRACT-042",
      status: "CONTRACT_SIGNED",
      contractStatus: "SIGNED",
      customerName: "Cliente Test PDF",
      customerEmail: "pdf.test@example.com",
      customerPhone: "+39 000 0000000",
      pickupAt: new Date("2026-08-10T08:00:00.000Z"),
      returnAt: new Date("2026-08-13T08:00:00.000Z"),
      pickupLocation: "Sede Test Nord",
      returnLocation: "Sede Test Nord",
      pickupKm: 10000,
      returnKm: 10400,
      expectedTotal: 420,
      finalTotal: 420,
      vehicle: { brand: "Fleetum", model: "Demo Car", plate: "TEST042" },
      customer: {
        customerType: "PERSONA_FISICA",
        firstName: "Cliente",
        lastName: "Test PDF",
        taxCode: "TEST-NON-REALE",
        drivingLicenseNumber: "TEST-LICENSE-042"
      },
      pricingSnapshot: {
        priceListName: "Listino test",
        baseRateUnit: "DAILY",
        baseRateAmount: 140,
        vatRate: 22,
        daysCharged: 3,
        expectedTotal: 420,
        finalTotal: 420
      }
    },
    branding: {
      companyName: "Autonoleggio Test S.r.l.",
      companyAddress: "Indirizzo dimostrativo",
      companyVat: "P.IVA TEST-NON-REALE",
      companyEmail: "azienda.test@example.com",
      companyPhone: "+39 000 0000000",
      brandPrimary: "#102a56",
      brandAccent: "#2563eb"
    }
  });

  assert.equal(buffer.subarray(0, 4).toString("ascii"), "%PDF");
  const pdf = await PDFDocument.load(buffer);
  assert.ok(pdf.getPageCount() >= 3, `attese almeno 3 pagine, ricevute ${pdf.getPageCount()}`);

  const text = await extractPdfText(buffer);
  assert.match(text, /CLAUSOLA VERSIONATA UNICA 1/);
  assert.match(text, /CLAUSOLA VERSIONATA UNICA 12/);
  assert.match(text, /template versione 42/i);
  assert.doesNotMatch(text, /Multe, pedaggi, ZTL, parcheggi/);
  assert.doesNotMatch(text, /\bundefined\b|\bnull\b|\[object Object\]/);
});

test("SaaS invoice PDF paginates long item lists and keeps totals readable", async () => {
  const items = Array.from({ length: 22 }, (_, index) => ({
    description: `Voce servizio ${String(index + 1).padStart(2, "0")} - dettaglio professionale esteso per verificare una riga di fattura multipagina senza sovrapposizioni`,
    quantity: 1,
    unitPrice: index === 0 ? 199 : 10,
    total: index === 0 ? 199 : 10
  }));

  const buffer = await buildSaasInvoicePdf({
    invoiceNumber: "FLT-TEST-2026-0042",
    issueDate: "2026-08-01",
    dueDate: "2026-08-15",
    periodStart: "2026-08-01",
    periodEnd: "2026-09-01",
    status: "PAID",
    currency: "EUR",
    subtotal: 409,
    taxRate: 22,
    taxAmount: 89.98,
    total: 498.98,
    billingName: "Cliente SaaS Test S.r.l.",
    billingVatNumber: "TEST-NON-REALE",
    billingAddress: "Indirizzo cliente dimostrativo",
    billingEmail: "billing.test@example.com",
    notes: "Nota di pagamento finale che deve restare separata dal dettaglio delle righe.",
    items,
    issuer: {
      name: "Fleetum Test",
      vat: "P.IVA TEST-NON-REALE",
      address: "Indirizzo emittente dimostrativo",
      email: "fleetum.test@example.com",
      website: "fleetum.it"
    },
    logoFilePaths: []
  });

  assert.equal(buffer.subarray(0, 4).toString("ascii"), "%PDF");
  const pdf = await PDFDocument.load(buffer);
  assert.ok(pdf.getPageCount() >= 2, `attese almeno 2 pagine, ricevute ${pdf.getPageCount()}`);

  const text = await extractPdfText(buffer);
  assert.match(text, /Voce servizio 01/);
  assert.match(text, /Voce servizio 22/);
  assert.match(text, /Totale/);
  assert.match(text, /498,98/);
  assert.match(text, /COPIA DI CORTESIA/);
  assert.match(text, /Nota di pagamento finale/);
  assert.doesNotMatch(text, /\bundefined\b|\bnull\b|\[object Object\]/);
});
