import { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma/client.js";
import { exactMoneyReader } from "../../infrastructure/database/exact-money-reader.js";
import { EmailQueueService } from "../../infrastructure/email/email-queue-service.js";
import { env } from "../../shared/config/env.js";
import { AppError } from "../../shared/errors/app-error.js";
import { ensureKnownPlan, getPlanMonthlyPrice } from "./feature-entitlements-service.js";
import { buildSaasInvoicePdf } from "./saas-invoice-pdf-service.js";

const TAX_RATE = 22;

type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: {
    tenant: { select: { id: true; name: true } };
    items: true;
    deliveries: { orderBy: { createdAt: "desc" } };
  };
}>;

type LicenseSnapshot = {
  plan: string;
  seats?: number;
  status?: string;
  expiresAt?: string | null;
  priceMonthly?: number | null;
  billingCycle?: "monthly" | "yearly";
};

const hydrateInvoiceRows = async (
  rows: readonly InvoiceWithRelations[],
  tenantId?: string
): Promise<InvoiceWithRelations[]> => {
  const exactInvoices = await exactMoneyReader.hydrate(
    "Invoice",
    rows,
    tenantId ? { tenantId } : {}
  );
  const exactItems = await exactMoneyReader.hydrate(
    "InvoiceItem",
    rows.flatMap((invoice) => invoice.items)
  );
  const itemById = new Map(exactItems.map((item) => [item.id, item]));

  return exactInvoices.map((invoice) => ({
    ...invoice,
    items: invoice.items.map((item) => itemById.get(item.id) ?? item)
  }));
};

const issuer = {
  name: process.env.FLEETUM_BILLING_LEGAL_NAME || "Fleetum",
  vat: process.env.FLEETUM_BILLING_VAT || "",
  address: process.env.FLEETUM_BILLING_ADDRESS || "",
  email: process.env.FLEETUM_BILLING_EMAIL || "info@fleetum.it",
  pec: process.env.FLEETUM_BILLING_PEC || "",
  sdi: process.env.FLEETUM_BILLING_SDI || "",
  iban: process.env.FLEETUM_BILLING_IBAN || "",
  website: "fleetum.it"
};

const money = (value: number) => Number(value.toFixed(2));
const formatMoney = (value: number, currency = "EUR") =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency, minimumFractionDigits: 2 }).format(value);
const formatDate = (value: Date | string) => new Date(value).toLocaleDateString("it-IT");
const formatPeriod = (start: Date | string, end: Date | string) => `${formatDate(start)} - ${formatDate(end)}`;

const parseLicense = (details: unknown): LicenseSnapshot | null => {
  if (!details || typeof details !== "object") return null;
  const payload = details as Record<string, unknown>;
  const source = payload.after && typeof payload.after === "object" ? (payload.after as Record<string, unknown>) : payload;
  return {
    plan: String(source.plan ?? "STARTER"),
    seats: Number.isFinite(Number(source.seats)) ? Number(source.seats) : 3,
    status: source.status ? String(source.status) : "ACTIVE",
    expiresAt: source.expiresAt ? String(source.expiresAt) : null,
    priceMonthly: Number.isFinite(Number(source.priceMonthly)) && Number(source.priceMonthly) > 0 ? Number(source.priceMonthly) : null,
    billingCycle: source.billingCycle === "yearly" ? "yearly" : "monthly"
  };
};

const monthBounds = (now = new Date()) => {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return { start, end };
};

const dueDateFrom = (issueDate: Date) => new Date(issueDate.getTime() + 14 * 24 * 60 * 60 * 1000);

const latestLicenseForTenant = async (tenantId: string): Promise<LicenseSnapshot> => {
  const row = await prisma.auditLog.findFirst({
    where: { tenantId, resource: "tenant", resourceId: tenantId, action: "PLATFORM_LICENSE_UPDATED" },
    orderBy: { createdAt: "desc" },
    select: { details: true }
  });
  return parseLicense(row?.details ?? null) ?? { plan: "STARTER", seats: 3, status: "PENDING", billingCycle: "monthly", priceMonthly: null };
};

const nextInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: {
      invoiceNumber: { startsWith: `FLT-${year}-` }
    }
  });
  return `FLT-${year}-${String(count + 1).padStart(5, "0")}`;
};

const toPublicInvoice = (invoice: InvoiceWithRelations) => ({
  id: invoice.id,
  tenantId: invoice.tenantId,
  tenantName: invoice.tenant.name,
  invoiceNumber: invoice.invoiceNumber,
  issueDate: invoice.issueDate,
  dueDate: invoice.dueDate,
  periodStart: invoice.periodStart,
  periodEnd: invoice.periodEnd,
  status: invoice.status,
  currency: invoice.currency,
  subtotal: invoice.subtotal,
  taxRate: invoice.taxRate,
  taxAmount: invoice.taxAmount,
  total: invoice.total,
  billingName: invoice.billingName,
  billingEmail: invoice.billingEmail,
  sentAt: invoice.sentAt,
  createdAt: invoice.createdAt,
  deliveries: invoice.deliveries.map((delivery) => ({
    id: delivery.id,
    channel: delivery.channel,
    recipient: delivery.recipient,
    status: delivery.status,
    provider: delivery.provider,
    providerMessageId: delivery.providerMessageId,
    errorMessage: delivery.errorMessage,
    sentAt: delivery.sentAt,
    createdAt: delivery.createdAt
  })),
  items: invoice.items.map((item) => ({
    id: item.id,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: item.subtotal,
    taxRate: item.taxRate,
    taxAmount: item.taxAmount,
    total: item.total
  }))
});

export class InvoiceService {
  constructor(private readonly emailQueueService = new EmailQueueService()) {}

  async listPlatformInvoices() {
    const rows = await prisma.invoice.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        tenant: { select: { id: true, name: true } },
        items: true,
        deliveries: { orderBy: { createdAt: "desc" } }
      }
    });
    const exactRows = await hydrateInvoiceRows(rows);
    return { data: exactRows.map(toPublicInvoice) };
  }

  async listTenantInvoices(tenantId: string) {
    const rows = await prisma.invoice.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        tenant: { select: { id: true, name: true } },
        items: true,
        deliveries: { orderBy: { createdAt: "desc" } }
      }
    });
    const exactRows = await hydrateInvoiceRows(rows, tenantId);
    return { data: exactRows.map(toPublicInvoice) };
  }

  async getPlatformInvoice(invoiceId: string) {
    const invoice = await this.findInvoice(invoiceId);
    return { data: toPublicInvoice(invoice) };
  }

  async getTenantInvoice(tenantId: string, invoiceId: string) {
    const invoice = await this.findInvoice(invoiceId, tenantId);
    return { data: toPublicInvoice(invoice) };
  }

  async generateForTenant(input: { tenantId: string; actorUserId: string; sourceIp: string }) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: input.tenantId },
      include: {
        tenantProfile: true,
        users: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
          select: { email: true, firstName: true, lastName: true }
        }
      }
    });
    if (!tenant) throw new AppError("Tenant non trovato", 404, "NOT_FOUND");

    const profile = tenant.tenantProfile;
    const billingEmail = profile?.email || profile?.adminEmail || tenant.users[0]?.email || null;
    const billingName = profile?.legalName || profile?.tradeName || tenant.name;
    const billingAddress = [profile?.legalAddress, profile?.postalCode, profile?.city, profile?.province, profile?.country]
      .filter(Boolean)
      .join(", ");

    if (!billingEmail) {
      throw new AppError("Email fatturazione tenant mancante", 422, "TENANT_BILLING_EMAIL_MISSING");
    }

    const license = await latestLicenseForTenant(input.tenantId);
    const plan = ensureKnownPlan(license.plan);
    const monthlyPrice = license.priceMonthly ?? getPlanMonthlyPrice(plan);
    const billingCycle = license.billingCycle === "yearly" ? "yearly" : "monthly";
    const quantity = billingCycle === "yearly" ? 12 : 1;
    const unitPrice = monthlyPrice;
    const subtotal = money(unitPrice * quantity);
    const taxAmount = money((subtotal * TAX_RATE) / 100);
    const total = money(subtotal + taxAmount);
    const issueDate = new Date();
    const { start, end } = monthBounds(issueDate);
    const invoiceNumber = await nextInvoiceNumber();

    const invoice = await prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          tenantId: tenant.id,
          invoiceNumber,
          issueDate,
          dueDate: dueDateFrom(issueDate),
          periodStart: start,
          periodEnd: billingCycle === "yearly" ? new Date(Date.UTC(issueDate.getUTCFullYear(), 11, 31, 23, 59, 59, 999)) : end,
          status: "GENERATED",
          currency: "EUR",
          subtotal,
          taxRate: TAX_RATE,
          taxAmount,
          total,
          billingName,
          billingVatNumber: profile?.vatNumber ?? null,
          billingTaxCode: profile?.taxCode ?? null,
          billingAddress: billingAddress || null,
          billingEmail,
          billingPec: profile?.pec ?? null,
          billingSdi: profile?.sdiCode ?? null,
          notes: "Documento riepilogativo / copia di cortesia. Non sostituisce fattura elettronica SDI se non emessa tramite sistema fiscale certificato.",
          items: {
            create: {
              description: `Abbonamento Fleetum ${plan} (${billingCycle === "yearly" ? "annuale" : "mensile"})`,
              quantity,
              unitPrice,
              subtotal,
              taxRate: TAX_RATE,
              taxAmount,
              total
            }
          }
        },
        include: {
          tenant: { select: { id: true, name: true } },
          items: true,
          deliveries: { orderBy: { createdAt: "desc" } }
        }
      });

      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: input.actorUserId,
          action: "PLATFORM_INVOICE_GENERATED",
          resource: "invoice",
          resourceId: created.id,
          details: {
            actor: input.actorUserId,
            sourceIp: input.sourceIp,
            invoiceNumber: created.invoiceNumber,
            total: created.total,
            status: created.status
          } as Prisma.InputJsonValue
        }
      });
      return created;
    });

    const exactInvoice = (await hydrateInvoiceRows([invoice], invoice.tenantId))[0];
    return { data: toPublicInvoice(exactInvoice) };
  }

  async updateStatus(input: { invoiceId: string; status: string; actorUserId: string; sourceIp: string }) {
    const allowed = new Set(["DRAFT", "GENERATED", "SENT", "PAID", "OVERDUE", "VOID", "ERROR"]);
    if (!allowed.has(input.status)) throw new AppError("Stato fattura non valido", 400, "INVALID_INVOICE_STATUS");
    const current = await this.findInvoice(input.invoiceId);
    const updated = await prisma.invoice.update({
      where: { id: input.invoiceId },
      data: { status: input.status as any },
      include: {
        tenant: { select: { id: true, name: true } },
        items: true,
        deliveries: { orderBy: { createdAt: "desc" } }
      }
    });
    await prisma.auditLog.create({
      data: {
        tenantId: updated.tenantId,
        userId: input.actorUserId,
        action: "PLATFORM_INVOICE_STATUS_CHANGED",
        resource: "invoice",
        resourceId: updated.id,
        details: { actor: input.actorUserId, sourceIp: input.sourceIp, before: current.status, after: updated.status } as Prisma.InputJsonValue
      }
    });
    const exactUpdated = (await hydrateInvoiceRows([updated], updated.tenantId))[0];
    return { data: toPublicInvoice(exactUpdated) };
  }

  async pdfBufferForPlatform(invoiceId: string) {
    return this.renderPdf(await this.findInvoice(invoiceId));
  }

  async pdfBufferForTenant(tenantId: string, invoiceId: string) {
    return this.renderPdf(await this.findInvoice(invoiceId, tenantId));
  }

  async sendEmail(input: { invoiceId: string; actorUserId: string; sourceIp: string }) {
    const invoice = await this.findInvoice(input.invoiceId);
    if (!invoice.billingEmail) throw new AppError("Email fatturazione mancante", 422, "INVOICE_RECIPIENT_MISSING");
    const pdf = await this.renderPdf(invoice);
    const delivery = await prisma.invoiceDelivery.create({
      data: {
        invoiceId: invoice.id,
        channel: "EMAIL",
        recipient: invoice.billingEmail,
        status: "PENDING"
      }
    });

    const subject = `Fattura Fleetum ${invoice.invoiceNumber} - ${formatPeriod(invoice.periodStart, invoice.periodEnd)}`;
    const text = [
      `Gentile ${invoice.billingName},`,
      `in allegato trovi il documento riepilogativo Fleetum ${invoice.invoiceNumber}.`,
      `Periodo: ${formatPeriod(invoice.periodStart, invoice.periodEnd)}`,
      `Totale: ${formatMoney(invoice.total, invoice.currency)}`,
      `Scadenza: ${formatDate(invoice.dueDate)}`,
      "Accedi alla tua area Fleetum per consultare le fatture e lo stato del piano.",
      env.APP_URL,
      "",
      "Nota: documento riepilogativo / copia di cortesia se non emesso tramite sistema SDI certificato."
    ].join("\n");

    const html = this.invoiceEmailHtml(invoice);
    const queued = await this.emailQueueService.enqueue({
      tenantId: invoice.tenantId,
      type: "SAAS_INVOICE_EMAIL",
      recipient: invoice.billingEmail,
      subject,
      body: text,
      meta: {
        fromName: "Fleetum Billing",
        replyTo: issuer.email,
        invoiceId: invoice.id,
        invoiceDeliveryId: delivery.id,
        tenantId: invoice.tenantId,
        html,
        attachments: [
          {
            filename: `${invoice.invoiceNumber}.pdf`,
            contentBase64: pdf.toString("base64"),
            contentType: "application/pdf"
          }
        ]
      }
    });

    await this.emailQueueService.processPending(new Date(), { ids: [queued.id], take: 1 });
    const processed = await prisma.emailQueue.findUnique({ where: { id: queued.id }, select: { status: true, lastError: true, meta: true } });
    const deliveryStatus = processed?.status === "SENT" ? "SENT" : "FAILED";
    const meta = (processed?.meta ?? {}) as Record<string, unknown>;

    const updatedDelivery = await prisma.invoiceDelivery.update({
      where: { id: delivery.id },
      data: {
        status: deliveryStatus,
        provider: typeof meta.emailProvider === "string" ? meta.emailProvider : null,
        providerMessageId: typeof meta.providerMessageId === "string" ? meta.providerMessageId : null,
        errorMessage: deliveryStatus === "FAILED" ? (processed?.lastError ?? "Invio email fattura fallito") : null,
        sentAt: deliveryStatus === "SENT" ? new Date() : null
      }
    });

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: deliveryStatus === "SENT" ? "SENT" : "ERROR",
        sentAt: deliveryStatus === "SENT" ? new Date() : invoice.sentAt
      },
      include: {
        tenant: { select: { id: true, name: true } },
        items: true,
        deliveries: { orderBy: { createdAt: "desc" } }
      }
    });

    await prisma.auditLog.create({
      data: {
        tenantId: invoice.tenantId,
        userId: input.actorUserId,
        action: deliveryStatus === "SENT" ? "PLATFORM_INVOICE_EMAIL_SENT" : "PLATFORM_INVOICE_EMAIL_FAILED",
        resource: "invoice",
        resourceId: invoice.id,
        details: {
          actor: input.actorUserId,
          sourceIp: input.sourceIp,
          queueEmailId: queued.id,
          deliveryId: updatedDelivery.id,
          provider: updatedDelivery.provider,
          providerMessageId: updatedDelivery.providerMessageId,
          recipientMasked: invoice.billingEmail.replace(/^(.{2}).*(@.*)$/, "$1***$2"),
          error: updatedDelivery.errorMessage
        } as Prisma.InputJsonValue
      }
    });

    if (deliveryStatus !== "SENT") {
      throw new AppError(updatedDelivery.errorMessage ?? "Invio email fattura fallito", 502, "INVOICE_EMAIL_FAILED");
    }

    const exactUpdated = (await hydrateInvoiceRows([updatedInvoice], updatedInvoice.tenantId))[0];
    return { data: toPublicInvoice(exactUpdated) };
  }

  private async findInvoice(invoiceId: string, tenantId?: string): Promise<InvoiceWithRelations> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, deletedAt: null, ...(tenantId ? { tenantId } : {}) },
      include: {
        tenant: { select: { id: true, name: true } },
        items: true,
        deliveries: { orderBy: { createdAt: "desc" } }
      }
    });
    if (!invoice) throw new AppError("Fattura non trovata", 404, "INVOICE_NOT_FOUND");
    return (await hydrateInvoiceRows([invoice], tenantId))[0];
  }

  private invoiceEmailHtml(invoice: InvoiceWithRelations) {
    return `
      <div style="margin:0;padding:0;background:#07111f;font-family:Inter,Manrope,Arial,sans-serif;color:#e6ecf2;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:38px 16px;background:radial-gradient(circle at 18% 0%,rgba(37,99,255,.30),transparent 34rem),radial-gradient(circle at 86% 10%,rgba(0,184,169,.20),transparent 30rem),#07111f;">
          <tr><td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:660px;border:1px solid rgba(230,236,242,.14);border-radius:28px;overflow:hidden;background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.035));box-shadow:0 28px 90px rgba(0,0,0,.38);">
              <tr><td style="padding:30px 34px 10px;">
                <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#9fb2d2;font-weight:800;">Fleetum Billing</div>
                <h1 style="margin:12px 0 10px;font-size:30px;line-height:1.1;letter-spacing:-.04em;color:#fff;">${invoice.invoiceNumber}</h1>
                <p style="margin:0;color:#a8b4c8;font-size:15px;line-height:1.65;">Documento riepilogativo per ${invoice.billingName}. Il PDF e' allegato a questa email.</p>
              </td></tr>
              <tr><td style="padding:18px 34px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid rgba(50,221,209,.22);border-radius:22px;background:rgba(5,12,24,.72);">
                  <tr>
                    <td style="padding:18px;color:#8ea3c4;font-size:12px;text-transform:uppercase;letter-spacing:.14em;font-weight:800;">Periodo<br><span style="display:block;margin-top:8px;color:#fff;font-size:15px;letter-spacing:0;text-transform:none;">${formatPeriod(invoice.periodStart, invoice.periodEnd)}</span></td>
                    <td style="padding:18px;color:#8ea3c4;font-size:12px;text-transform:uppercase;letter-spacing:.14em;font-weight:800;">Scadenza<br><span style="display:block;margin-top:8px;color:#fff;font-size:15px;letter-spacing:0;text-transform:none;">${formatDate(invoice.dueDate)}</span></td>
                    <td style="padding:18px;color:#8ea3c4;font-size:12px;text-transform:uppercase;letter-spacing:.14em;font-weight:800;">Totale<br><span style="display:block;margin-top:8px;color:#fff;font-size:22px;letter-spacing:-.03em;text-transform:none;">${formatMoney(invoice.total, invoice.currency)}</span></td>
                  </tr>
                </table>
              </td></tr>
              <tr><td style="padding:0 34px 34px;">
                <a href="${env.APP_URL}/upgrade" style="display:inline-block;border-radius:999px;background:linear-gradient(135deg,#2563ff,#32ddd1);padding:12px 18px;color:#fff;text-decoration:none;font-size:14px;font-weight:800;">Accedi alla tua area Fleetum</a>
                <p style="margin:18px 0 0;color:#7f8da6;font-size:12px;line-height:1.6;">Se hai domande, rispondi a questa email o scrivi a ${issuer.email}.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </div>`;
  }

  private async renderPdf(invoice: InvoiceWithRelations) {
    return buildSaasInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
      status: invoice.status,
      currency: invoice.currency,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      billingName: invoice.billingName,
      billingVatNumber: invoice.billingVatNumber,
      billingTaxCode: invoice.billingTaxCode,
      billingAddress: invoice.billingAddress,
      billingEmail: invoice.billingEmail,
      billingPec: invoice.billingPec,
      billingSdi: invoice.billingSdi,
      notes: invoice.notes,
      items: invoice.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total
      })),
      issuer
    });
  }
}
