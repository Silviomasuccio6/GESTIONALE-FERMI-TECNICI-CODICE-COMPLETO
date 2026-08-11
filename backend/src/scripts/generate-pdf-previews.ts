import fs from "node:fs/promises";
import path from "node:path";
import { buildEnterpriseContractPdf } from "../application/services/enterprise-contract-pdf-service.js";
import { buildSaasInvoicePdf } from "../application/services/saas-invoice-pdf-service.js";

const repositoryRoot = path.basename(process.cwd()) === "backend"
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const outputDirectory = path.join(repositoryRoot, "output", "pdf");

const contractContent = [
  "CONTRATTO DI NOLEGGIO VEICOLO SENZA CONDUCENTE",
  "",
  "Riferimento contratto: DEMO-BK-2026-014",
  "Questo testo dimostrativo serve esclusivamente a verificare l'impaginazione del PDF. In produzione viene utilizzato il contenuto versionato configurato dal tenant.",
  "",
  "1. PARTI DEL CONTRATTO",
  "Locatore: Fleetum Italia S.r.l., con sede e dati fiscali riportati nell'intestazione.",
  "Cliente: Luca Bianchi, identificato nei dati riepilogativi del contratto.",
  "",
  "2. CONDUCENTI AUTORIZZATI",
  "Il conducente principale e gli eventuali conducenti aggiuntivi devono risultare registrati prima della consegna del veicolo.",
  "",
  "3. VEICOLO, PERIODO E LUOGHI DI NOLEGGIO",
  "Veicolo BMW X1 sDrive18d, targa FT100AA. Ritiro presso Roma Centro e riconsegna presso la stessa sede.",
  "",
  "4. CONDIZIONI ECONOMICHE",
  "Il riepilogo economico iniziale riporta listino, chilometraggio incluso, importi previsti e importi consuntivi disponibili.",
  "",
  "5. CONSEGNA, VERIFICA E RICONSEGNA",
  "Lo stato del veicolo, le dotazioni e le eventuali anomalie vengono documentati negli allegati operativi collegati al noleggio.",
  "",
  "6. OBBLIGHI DI UTILIZZO",
  "Il contenuto completo di questa sezione proviene dal template contrattuale approvato dall'azienda di noleggio.",
  "",
  "7. SINISTRI, FURTO, GUASTI E ASSISTENZA",
  "Gli eventi operativi devono essere comunicati e documentati secondo le procedure definite nel contratto versionato.",
  "",
  "8. CARBURANTE, ENERGIA, PULIZIA E DOTAZIONI",
  "Le condizioni applicabili sono quelle riportate nel testo contrattuale e negli allegati sottoscritti.",
  "",
  "9. TRATTAMENTO DATI, COMUNICAZIONI E ADEMPIMENTI",
  "Le informative privacy restano documenti separati e devono essere validate dai professionisti incaricati.",
  "",
  "10. FIRMA, ACCETTAZIONE E CLAUSOLE",
  "La sezione firme del PDF registra lo stato della sottoscrizione e l'eventuale firma grafica associata al contratto.",
  "",
  "Firma cliente: ______________________",
  "Firma operatore: ____________________"
].join("\n");

await fs.mkdir(outputDirectory, { recursive: true });

const contractPdf = await buildEnterpriseContractPdf({
  contract: {
    title: "Contratto di noleggio veicolo senza conducente",
    content: contractContent,
    status: "SIGNED",
    templateVersion: 7,
    createdAt: "2026-08-11T09:00:00.000Z",
    updatedAt: "2026-08-11T10:30:00.000Z",
    signedAt: "2026-08-11T10:30:00.000Z",
    signatureSizeBytes: 12400
  },
  booking: {
    code: "DEMO-BK-2026-014",
    status: "CONTRACT_SIGNED",
    contractStatus: "SIGNED",
    customerName: "Luca Bianchi",
    customerEmail: "cliente.demo@example.com",
    customerPhone: "+39 000 0000000",
    pickupAt: new Date("2026-08-10T09:00:00.000Z"),
    returnAt: new Date("2026-08-17T09:00:00.000Z"),
    pickupLocation: "Roma Centro",
    returnLocation: "Roma Centro",
    pickupKm: 24120,
    returnKm: 24780,
    expectedTotal: 834.48,
    finalTotal: 834.48,
    vehicle: { brand: "BMW", model: "X1 sDrive18d", plate: "FT100AA" },
    customer: {
      customerType: "PERSONA_FISICA",
      firstName: "Luca",
      lastName: "Bianchi",
      taxCode: "DEMO-CF-NON-REALE",
      dateOfBirth: "1990-01-01",
      placeOfBirth: "Roma",
      residenceAddress: "Via Dimostrativa 10, 00100 Roma",
      documentType: "Carta di identita",
      documentNumber: "DEMO-000001",
      documentExpiresAt: "2030-12-31",
      drivingLicenseNumber: "DEMO-PATENTE-01",
      drivingLicenseCategory: "B",
      drivingLicenseExpiresAt: "2030-12-31"
    },
    pricingSnapshot: {
      priceListName: "Listino Premium Demo",
      pricePackageName: "700 km inclusi",
      extraKmPolicyName: "0,35 EUR / km",
      baseRateUnit: "DAILY",
      baseRateAmount: 98,
      vatRate: 22,
      discountPercent: 0,
      includedKmTotal: 700,
      extraKmActual: 0,
      expectedTotal: 834.48,
      finalTotal: 834.48
    }
  },
  branding: {
    companyName: "Fleetum Italia S.r.l.",
    companyAddress: "Via Dimostrativa 24, 00100 Roma (RM)",
    companyVat: "P.IVA DEMO-NON-REALE",
    companyEmail: "info@fleetum.it",
    companyPhone: "+39 000 0000000",
    logoFilePath: "assets/fleetum-logo-horizontal.png",
    brandPrimary: "#102a56",
    brandAccent: "#102a56"
  }
});

const invoiceItems = Array.from({ length: 6 }, (_, index) => ({
  description: index === 0
    ? "Abbonamento Fleetum Pro - mensile"
    : `Servizio dimostrativo ${index} con descrizione estesa per verificare l'impaginazione multipagina`,
  quantity: 1,
  unitPrice: index === 0 ? 199 : 0,
  total: index === 0 ? 199 : 0
}));

const invoicePdf = await buildSaasInvoicePdf({
  invoiceNumber: "FLT-DEMO-2026-00042",
  issueDate: "2026-08-11",
  dueDate: "2026-08-25",
  periodStart: "2026-08-01",
  periodEnd: "2026-09-01",
  status: "PAID",
  currency: "EUR",
  subtotal: 199,
  taxRate: 22,
  taxAmount: 43.78,
  total: 242.78,
  billingName: "Noleggio Demo Italia S.r.l.",
  billingVatNumber: "DEMO-NON-REALE",
  billingTaxCode: "DEMO-CF-NON-REALE",
  billingAddress: "Via Dimostrativa 24, 00100 Roma (RM), IT",
  billingEmail: "amministrazione.demo@example.com",
  billingPec: "demo@pec.example.com",
  billingSdi: "DEMO123",
  notes: "Documento dimostrativo generato esclusivamente per la revisione grafica locale.",
  items: invoiceItems,
  issuer: {
    name: "Fleetum",
    vat: "P.IVA DEMO-NON-REALE",
    address: "Sede dimostrativa, Italia",
    email: "info@fleetum.it",
    pec: "pec.demo@example.com",
    sdi: "DEMO123",
    iban: "IBAN DEMO NON REALE",
    website: "fleetum.it"
  }
});

const contractPath = path.join(outputDirectory, "fleetum-contratto-noleggio-preview.pdf");
const invoicePath = path.join(outputDirectory, "fleetum-fattura-saas-preview.pdf");
await Promise.all([
  fs.writeFile(contractPath, contractPdf),
  fs.writeFile(invoicePath, invoicePdf)
]);

console.log(`Anteprima contratto: ${contractPath}`);
console.log(`Anteprima fattura: ${invoicePath}`);
