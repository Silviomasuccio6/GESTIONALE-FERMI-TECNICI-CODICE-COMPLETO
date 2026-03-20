import { Request, Response } from "express";
import { z } from "zod";
import { ManageStoppagesUseCases } from "../../../application/usecases/stoppages/manage-stoppages-usecases.js";
import { SendReminderUseCase } from "../../../application/usecases/reminders/send-reminder-usecase.js";
import { getSlaThresholdForPriority } from "../../../application/services/sla-policy.js";
import { StoppageOpsRepository } from "../../../domain/repositories/stoppage-ops-repository.js";
import { prisma } from "../../../infrastructure/database/prisma/client.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { stoppageStatusLabel } from "../../../shared/utils/stoppage-status-label.js";
import { stoppageSchema } from "../validators/stoppage-validators.js";
import { listQuerySchema } from "../validators/common.js";

const optionalDateTimeQuery = z.preprocess((value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  if (!normalized || normalized === "undefined" || normalized === "null") return undefined;
  if (Number.isNaN(new Date(normalized).getTime())) return undefined;
  return normalized;
}, z.string().datetime().optional());

export class StoppagesController {
  constructor(
    private readonly useCases: ManageStoppagesUseCases,
    private readonly reminderUseCase: SendReminderUseCase,
    private readonly opsRepository: StoppageOpsRepository
  ) {}

  private readonly allowedTransitions: Record<string, string[]> = {
    OPEN: ["IN_PROGRESS", "WAITING_PARTS", "SOLICITED", "CANCELED"],
    IN_PROGRESS: ["WAITING_PARTS", "SOLICITED", "CLOSED", "CANCELED"],
    WAITING_PARTS: ["IN_PROGRESS", "SOLICITED", "CLOSED", "CANCELED"],
    SOLICITED: ["IN_PROGRESS", "WAITING_PARTS", "CLOSED", "CANCELED"],
    CLOSED: [],
    CANCELED: []
  };

  private escalationLevel(daysOpen: number, thresholdDays: number) {
    if (daysOpen >= thresholdDays + 7) return "LEVEL_3";
    if (daysOpen >= thresholdDays + 3) return "LEVEL_2";
    if (daysOpen >= thresholdDays + 1) return "LEVEL_1";
    return null;
  }

  private async logEvent(
    tenantId: string,
    stoppageId: string,
    userId: string | undefined,
    type: string,
    message: string,
    payload?: Record<string, unknown>
  ) {
    await this.opsRepository.createEvent({ tenantId, stoppageId, userId, type, message, payload });
  }

  private async ensureClosureChecklist(
    tenantId: string,
    stoppageId: string,
    userId?: string
  ) {
    const checklist = await this.opsRepository.findLatestEventByType(tenantId, stoppageId, "CLOSURE_CHECKLIST");
    const c = (checklist?.payload as any) ?? null;
    const complete = Boolean(c?.photosUploaded && c?.finalCauseSet && c?.finalCostSet && c?.operatorSigned);
    if (complete) return;

    await this.opsRepository.createEvent({
      tenantId,
      stoppageId,
      userId,
      type: "CLOSURE_CHECKLIST",
      message: "Checklist chiusura auto-completata in fase di chiusura",
      payload: {
        photosUploaded: true,
        finalCauseSet: true,
        finalCostSet: true,
        operatorSigned: true,
        notes: "Auto-completata dal sistema durante la chiusura fermo."
      }
    });
  }

  list = async (req: Request, res: Response) => {
    const query = listQuerySchema
      .extend({
        status: z.preprocess((value) => (value === "" ? undefined : value), stoppageSchema.shape.status.optional())
      })
      .parse(req.query);
    const siteId = typeof req.query.siteId === "string" ? req.query.siteId : undefined;
    const workshopId = typeof req.query.workshopId === "string" ? req.query.workshopId : undefined;
    const pagination = { skip: (query.page - 1) * query.pageSize, take: query.pageSize };
    const result = await this.useCases.list(req.auth!.tenantId, {
      search: query.search,
      status: query.status,
      siteId,
      workshopId,
      sortBy: query.sortBy,
      sortDir: query.sortDir,
      ...pagination
    });
    res.json({ ...result, page: query.page, pageSize: query.pageSize });
  };

  getById = async (req: Request, res: Response) => {
    const item = await this.useCases.getById(req.auth!.tenantId, req.params.id);
    if (!item) throw new AppError("Fermo non trovato", 404, "NOT_FOUND");
    res.json(item);
  };

  create = async (req: Request, res: Response) => {
    const input = stoppageSchema.parse(req.body);
    const result = await this.useCases.create(req.auth!.tenantId, {
      ...input,
      openedAt: new Date(input.openedAt),
      closedAt: input.closedAt ? new Date(input.closedAt) : null,
      createdByUserId: req.auth!.userId
    });

    await this.logEvent(req.auth!.tenantId, (result as any).id, req.auth?.userId, "CREATED", "Fermo creato", {
      status: (result as any).status
    });

    res.status(201).json(result);
  };

  update = async (req: Request, res: Response) => {
    const input = stoppageSchema.partial().parse(req.body);
    const result = await this.useCases.update(req.auth!.tenantId, req.params.id, {
      ...input,
      ...(input.openedAt ? { openedAt: new Date(input.openedAt) } : {}),
      ...(input.closedAt ? { closedAt: new Date(input.closedAt) } : {})
    });

    await this.logEvent(req.auth!.tenantId, req.params.id, req.auth?.userId, "UPDATED", "Fermo aggiornato", input as any);
    res.json(result);
  };

  updateStatus = async (req: Request, res: Response) => {
    const status = stoppageSchema.shape.status.parse(req.body.status);
    if (!status) throw new AppError("Stato non valido", 422, "VALIDATION_ERROR");
    if (status === "CLOSED") {
      await this.ensureClosureChecklist(req.auth!.tenantId, req.params.id, req.auth?.userId);
    }

    const result = await this.useCases.update(req.auth!.tenantId, req.params.id, { status });

    await this.logEvent(
      req.auth!.tenantId,
      req.params.id,
      req.auth?.userId,
      "STATUS_CHANGED",
      `Stato aggiornato a ${stoppageStatusLabel(status)}`,
      {
      status
      }
    );
    res.json(result);
  };

  remove = async (req: Request, res: Response) => {
    await this.useCases.delete(req.auth!.tenantId, req.params.id);
    await this.logEvent(req.auth!.tenantId, req.params.id, req.auth?.userId, "DELETED", "Fermo eliminato");
    res.status(204).send();
  };

  sendManualReminder = async (req: Request, res: Response) => {
    const result = await this.reminderUseCase.manualEmail(req.auth!.tenantId, req.params.id);
    await this.logEvent(req.auth!.tenantId, req.params.id, req.auth?.userId, "REMINDER_MANUAL", "Reminder manuale richiesto");
    res.json(result);
  };

  whatsappLink = async (req: Request, res: Response) => {
    const stoppage = (await this.useCases.getById(req.auth!.tenantId, req.params.id)) as any;
    if (!stoppage) throw new AppError("Fermo non trovato", 404, "NOT_FOUND");
    const number = (stoppage.workshopWhatsappSnapshot || stoppage.workshop?.whatsapp || "").replace(/\D/g, "");
    if (!number) throw new AppError("Numero WhatsApp officina mancante", 400, "VALIDATION_ERROR");

    const message = [
      "Richiesta aggiornamento fermo",
      `Targa: ${stoppage.vehicle.plate}`,
      `Veicolo: ${stoppage.vehicle.brand} ${stoppage.vehicle.model}`,
      `Sede: ${stoppage.site.name}`,
      `Motivo: ${stoppage.reason}`,
      `Stato: ${stoppageStatusLabel(stoppage.status)}`
    ].join("\\n");

    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    res.json({ url });
  };

  listEvents = async (req: Request, res: Response) => {
    const events = await this.opsRepository.listEvents(req.auth!.tenantId, req.params.id, 100);
    res.json({ data: events });
  };

  workflowTransition = async (req: Request, res: Response) => {
    const payload = z
      .object({
        toStatus: z.enum(["OPEN", "IN_PROGRESS", "WAITING_PARTS", "SOLICITED", "CLOSED", "CANCELED"]),
        note: z.string().max(500).optional(),
        closureSummary: z.string().optional()
      })
      .parse(req.body);

    const current = (await this.useCases.getById(req.auth!.tenantId, req.params.id)) as any;
    if (!current) throw new AppError("Fermo non trovato", 404, "NOT_FOUND");
    if (current.status === payload.toStatus) throw new AppError("Il fermo è già in questo stato", 400, "VALIDATION_ERROR");

    const allowed = this.allowedTransitions[current.status] ?? [];
    if (!allowed.includes(payload.toStatus)) {
      throw new AppError(`Transizione non consentita da ${stoppageStatusLabel(current.status)} a ${stoppageStatusLabel(payload.toStatus)}`, 422, "VALIDATION_ERROR");
    }

    if (payload.toStatus === "CLOSED") {
      await this.ensureClosureChecklist(req.auth!.tenantId, req.params.id, req.auth?.userId);
    }

    const updated = await this.useCases.update(req.auth!.tenantId, req.params.id, { status: payload.toStatus });

    await this.logEvent(
      req.auth!.tenantId,
      req.params.id,
      req.auth?.userId,
      "WORKFLOW_TRANSITION",
      `Transizione workflow: ${stoppageStatusLabel(current.status)} -> ${stoppageStatusLabel(payload.toStatus)}`,
      { from: current.status, to: payload.toStatus, note: payload.note ?? null }
    );

    res.json(updated);
  };

  slaOverview = async (req: Request, res: Response) => {
    type SlaRow = {
      id: string;
      plate: string | undefined;
      site: string | undefined;
      workshop: string | undefined;
      status: string;
      priority: string | undefined;
      daysOpen: number;
      thresholdDays: number;
      remainingDays: number;
      breached: boolean;
    };

    const now = new Date();
    const rows = (await this.useCases.list(req.auth!.tenantId, { skip: 0, take: 500, sortDir: "desc" })) as any;
    const active = rows.data.filter((item: any) => item.status !== "CLOSED" && item.status !== "CANCELED");
    const data: SlaRow[] = active.map((item: any) => {
      const daysOpen = Math.floor((now.getTime() - new Date(item.openedAt).getTime()) / 86400000);
      const thresholdDays = getSlaThresholdForPriority(item.priority);
      const remainingDays = thresholdDays - daysOpen;
      const breached = remainingDays < 0;
      return {
        id: item.id,
        plate: item.vehicle?.plate,
        site: item.site?.name,
        workshop: item.workshop?.name,
        status: item.status,
        priority: item.priority,
        daysOpen,
        thresholdDays,
        remainingDays,
        breached
      };
    });

    res.json({
      kpis: {
        totalActive: data.length,
        breached: data.filter((x) => x.breached).length,
        expiringSoon: data.filter((x) => !x.breached && x.remainingDays <= 2).length
      },
      data: data.sort((a, b) => a.remainingDays - b.remainingDays)
    });
  };

  assignmentSuggestions = async (req: Request, res: Response) => {
    const [users, openStoppages] = await Promise.all([
      this.opsRepository.listActiveUsers(req.auth!.tenantId),
      this.opsRepository.listOpenStoppagesForAssignment(req.auth!.tenantId)
    ]);

    const workloads = users.map((user) => {
      const assigned = openStoppages.filter((x) => x.assignedToUserId === user.id);
      const weightedLoad = assigned.reduce((acc, item) => acc + (item.priority === "CRITICAL" ? 4 : item.priority === "HIGH" ? 3 : item.priority === "MEDIUM" ? 2 : 1), 0);
      return {
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        assignedCount: assigned.length,
        weightedLoad
      };
    });

    const suggestions = workloads.sort((a, b) => a.weightedLoad - b.weightedLoad).slice(0, 5);
    res.json({ data: workloads, suggestions });
  };

  calendar = async (req: Request, res: Response) => {
    const query = z
      .object({
        dateFrom: optionalDateTimeQuery,
        dateTo: optionalDateTimeQuery
      })
      .parse(req.query);
    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : new Date(Date.now() - 30 * 86400000);
    const dateTo = query.dateTo ? new Date(query.dateTo) : new Date(Date.now() + 30 * 86400000);

    const rows = await this.opsRepository.listCalendarRows(req.auth!.tenantId, dateFrom, dateTo);

    const events = rows.map((row) => ({
      id: row.id,
      title: `${row.vehicle.plate} · ${stoppageStatusLabel(row.status)}`,
      start: row.openedAt.toISOString(),
      end: (row.closedAt ?? new Date()).toISOString(),
      allDay: false,
      status: row.status,
      priority: row.priority,
      site: row.site.name,
      workshop: row.workshop.name
    }));
    res.json({ data: events });
  };

  reminderTemplatePreview = async (req: Request, res: Response) => {
    const query = z.object({ channel: z.enum(["EMAIL", "WHATSAPP"]).default("EMAIL") }).parse(req.query);
    const stoppage = (await this.useCases.getById(req.auth!.tenantId, req.params.id)) as any;
    if (!stoppage) throw new AppError("Fermo non trovato", 404, "NOT_FOUND");
    const days = Math.floor((Date.now() - new Date(stoppage.openedAt).getTime()) / 86400000);
    const base = `Targa: ${stoppage.vehicle.plate}\nVeicolo: ${stoppage.vehicle.brand} ${stoppage.vehicle.model}\nSede: ${stoppage.site.name}\nMotivo: ${stoppage.reason}\nGiorni fermo: ${days}\nStato: ${stoppageStatusLabel(stoppage.status)}`;
    const email = {
      subject: `[Sollecito] ${stoppage.vehicle.plate} - ${stoppage.site.name}`,
      body: `Buongiorno,\n\nsi richiede aggiornamento sul seguente fermo:\n${base}\n\nGrazie.`
    };
    const whatsapp = {
      message: `Richiesta aggiornamento fermo\n${base}\n\nGrazie.`,
      url: `https://wa.me/${String(stoppage.workshopWhatsappSnapshot || stoppage.workshop?.whatsapp || "").replace(/\D/g, "")}?text=${encodeURIComponent(`Richiesta aggiornamento fermo\n${base}\n\nGrazie.`)}`
    };
    res.json({ channel: query.channel, email, whatsapp });
  };

  costsSummary = async (req: Request, res: Response) => {
    const query = z
      .object({
        dateFrom: optionalDateTimeQuery,
        dateTo: optionalDateTimeQuery
      })
      .parse(req.query);
    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : new Date(Date.now() - 90 * 86400000);
    const dateTo = query.dateTo ? new Date(query.dateTo) : new Date();
    const rows = await this.opsRepository.listCostRows(req.auth!.tenantId, dateFrom, dateTo);
    const bySite = new Map<string, number>();
    const byWorkshop = new Map<string, number>();
    const now = new Date();
    let total = 0;
    for (const row of rows) {
      const days = Math.max(0, (Number((row.closedAt ?? now)) - Number(row.openedAt)) / 86400000);
      const cost = (row.estimatedCostPerDay ?? 0) * days;
      total += cost;
      bySite.set(row.site.name, (bySite.get(row.site.name) ?? 0) + cost);
      byWorkshop.set(row.workshop.name, (byWorkshop.get(row.workshop.name) ?? 0) + cost);
    }
    res.json({
      kpis: { estimatedTotalCost: Number(total.toFixed(2)) },
      bySite: Array.from(bySite.entries()).map(([name, cost]) => ({ name, cost: Number(cost.toFixed(2)) })).sort((a, b) => b.cost - a.cost),
      byWorkshop: Array.from(byWorkshop.entries()).map(([name, cost]) => ({ name, cost: Number(cost.toFixed(2)) })).sort((a, b) => b.cost - a.cost)
    });
  };

  costsVariance = async (req: Request, res: Response) => {
    const query = z
      .object({
        dateFrom: optionalDateTimeQuery,
        dateTo: optionalDateTimeQuery
      })
      .parse(req.query);
    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : new Date(Date.now() - 180 * 86400000);
    const dateTo = query.dateTo ? new Date(query.dateTo) : new Date();

    const rows = await prisma.stoppage.findMany({
      where: { tenantId: req.auth!.tenantId, deletedAt: null, openedAt: { gte: dateFrom, lte: dateTo } },
      include: {
        site: { select: { name: true } },
        workshop: { select: { name: true } },
        vehicle: { select: { plate: true, brand: true, model: true } },
        events: { where: { type: "FINAL_COST" }, orderBy: { createdAt: "desc" }, take: 1 }
      }
    });

    const now = new Date();
    const data = rows
      .map((row) => {
        const days = Math.max(0, (Number((row.closedAt ?? now)) - Number(row.openedAt)) / 86400000);
        const estimated = Number(((row.estimatedCostPerDay ?? 0) * days).toFixed(2));
        const actual = Number((((row.events[0]?.payload as any)?.actualTotalCost as number | undefined) ?? 0).toFixed(2));
        const variance = Number((actual - estimated).toFixed(2));
        const varianceRate = estimated > 0 ? Number(((variance / estimated) * 100).toFixed(2)) : 0;
        return {
          stoppageId: row.id,
          plate: row.vehicle.plate,
          vehicle: `${row.vehicle.brand} ${row.vehicle.model}`,
          site: row.site.name,
          workshop: row.workshop.name,
          status: row.status,
          estimated,
          actual,
          variance,
          varianceRate
        };
      })
      .filter((x) => x.actual > 0)
      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));

    const kpis = {
      totalWithConsuntivo: data.length,
      estimatedTotal: Number(data.reduce((acc, x) => acc + x.estimated, 0).toFixed(2)),
      actualTotal: Number(data.reduce((acc, x) => acc + x.actual, 0).toFixed(2)),
      varianceTotal: Number(data.reduce((acc, x) => acc + x.variance, 0).toFixed(2)),
      avgVarianceRate: data.length ? Number((data.reduce((acc, x) => acc + x.varianceRate, 0) / data.length).toFixed(2)) : 0
    };

    res.json({ kpis, data: data.slice(0, 100) });
  };

  listPartsOrders = async (req: Request, res: Response) => {
    const data = await this.opsRepository.listEventsByType(req.auth!.tenantId, req.params.id, "PARTS_ORDER");
    const parsed = data.map((x) => {
      const payload = (x.payload as any) ?? {};
      const etaDate = payload.etaDate ? new Date(payload.etaDate) : null;
      const etaRisk = etaDate ? Math.floor((Date.now() - etaDate.getTime()) / 86400000) : null;
      return {
        id: x.id,
        createdAt: x.createdAt,
        ...payload,
        etaRiskDays: etaRisk !== null ? Math.max(0, etaRisk) : null
      };
    });
    res.json({ data: parsed });
  };

  addPartsOrder = async (req: Request, res: Response) => {
    const payload = z
      .object({
        description: z.string().min(2),
        supplier: z.string().optional(),
        etaDate: z.string().optional(),
        estimatedCost: z.number().optional()
      })
      .parse(req.body);
    await this.opsRepository.createEvent({
      tenantId: req.auth!.tenantId,
      stoppageId: req.params.id,
      userId: req.auth?.userId,
      type: "PARTS_ORDER",
      message: `Ordine ricambio: ${payload.description}`,
      payload
    });
    res.status(201).json({ created: true });
  };

  getClosureChecklist = async (req: Request, res: Response) => {
    const row = await this.opsRepository.findLatestEventByType(req.auth!.tenantId, req.params.id, "CLOSURE_CHECKLIST");
    res.json({ data: row?.payload ?? null });
  };

  saveClosureChecklist = async (req: Request, res: Response) => {
    const payload = z
      .object({
        photosUploaded: z.boolean(),
        finalCauseSet: z.boolean(),
        finalCostSet: z.boolean(),
        operatorSigned: z.boolean(),
        notes: z.string().optional()
      })
      .parse(req.body);
    await this.opsRepository.createEvent({
      tenantId: req.auth!.tenantId,
      stoppageId: req.params.id,
      userId: req.auth?.userId,
      type: "CLOSURE_CHECKLIST",
      message: "Checklist chiusura aggiornata",
      payload
    });
    res.json({ updated: true });
  };

  setFinalCost = async (req: Request, res: Response) => {
    const payload = z.object({ actualTotalCost: z.number().nonnegative() }).parse(req.body);
    const threshold = 1500;
    if (payload.actualTotalCost >= threshold) {
      const latestDecision = await this.opsRepository.findLatestEventByType(req.auth!.tenantId, req.params.id, "COST_APPROVAL_DECISION");
      const decisionPayload = (latestDecision?.payload as any) ?? null;
      const approved = Boolean(decisionPayload?.approved);
      if (!approved) {
        throw new AppError(
          `Serve approvazione costo per importi >= € ${threshold}. Richiedi approvazione prima del consuntivo.`,
          422,
          "COST_APPROVAL_REQUIRED"
        );
      }
    }
    await this.opsRepository.createEvent({
      tenantId: req.auth!.tenantId,
      stoppageId: req.params.id,
      userId: req.auth?.userId,
      type: "FINAL_COST",
      message: "Costo consuntivo impostato",
      payload
    });
    res.json({ updated: true });
  };

  listCostApprovals = async (req: Request, res: Response) => {
    const [requests, decisions] = await Promise.all([
      this.opsRepository.listEventsByType(req.auth!.tenantId, req.params.id, "COST_APPROVAL_REQUEST"),
      this.opsRepository.listEventsByType(req.auth!.tenantId, req.params.id, "COST_APPROVAL_DECISION")
    ]);
    res.json({
      requests: requests.map((x) => ({ id: x.id, createdAt: x.createdAt, ...((x.payload as any) ?? {}) })),
      decisions: decisions.map((x) => ({ id: x.id, createdAt: x.createdAt, ...((x.payload as any) ?? {}) }))
    });
  };

  requestCostApproval = async (req: Request, res: Response) => {
    const payload = z
      .object({
        estimatedTotalCost: z.number().nonnegative(),
        reason: z.string().min(3),
        note: z.string().optional()
      })
      .parse(req.body);
    await this.opsRepository.createEvent({
      tenantId: req.auth!.tenantId,
      stoppageId: req.params.id,
      userId: req.auth?.userId,
      type: "COST_APPROVAL_REQUEST",
      message: "Richiesta approvazione costo",
      payload
    });
    res.status(201).json({ created: true });
  };

  decideCostApproval = async (req: Request, res: Response) => {
    const payload = z
      .object({
        approved: z.boolean(),
        approvedCost: z.number().nonnegative().optional(),
        reason: z.string().optional()
      })
      .parse(req.body);
    await this.opsRepository.createEvent({
      tenantId: req.auth!.tenantId,
      stoppageId: req.params.id,
      userId: req.auth?.userId,
      type: "COST_APPROVAL_DECISION",
      message: payload.approved ? "Approvazione costo concessa" : "Approvazione costo rifiutata",
      payload
    });
    res.json({ updated: true });
  };

  bulkUpdate = async (req: Request, res: Response) => {
    const payload = z
      .object({
        ids: z.array(z.string().min(1)).min(1),
        action: z.enum(["SET_STATUS", "SET_PRIORITY", "SEND_REMINDER"]),
        status: stoppageSchema.shape.status.optional(),
        priority: stoppageSchema.shape.priority.optional()
      })
      .parse(req.body);

    const results: Array<{ id: string; ok: boolean; message?: string }> = [];

    for (const id of payload.ids) {
      try {
        if (payload.action === "SET_STATUS" && payload.status) {
          await this.useCases.update(req.auth!.tenantId, id, { status: payload.status });
          await this.logEvent(
            req.auth!.tenantId,
            id,
            req.auth?.userId,
            "BULK_STATUS",
            `Stato bulk: ${stoppageStatusLabel(payload.status)}`
          );
        }
        if (payload.action === "SET_PRIORITY" && payload.priority) {
          await this.useCases.update(req.auth!.tenantId, id, { priority: payload.priority });
          await this.logEvent(req.auth!.tenantId, id, req.auth?.userId, "BULK_PRIORITY", `Priorita bulk: ${payload.priority}`);
        }
        if (payload.action === "SEND_REMINDER") {
          await this.reminderUseCase.manualEmail(req.auth!.tenantId, id);
          await this.logEvent(req.auth!.tenantId, id, req.auth?.userId, "BULK_REMINDER", "Reminder bulk inviato");
        }
        results.push({ id, ok: true });
      } catch (error) {
        results.push({ id, ok: false, message: (error as Error).message });
      }
    }

    res.json({ data: results });
  };

  alerts = async (req: Request, res: Response) => {
    const rows = (await this.useCases.list(req.auth!.tenantId, { skip: 0, take: 500, sortDir: "desc" })) as any;
    const now = new Date();

    const alerts = rows.data
      .filter((item: any) => item.status !== "CLOSED" && item.status !== "CANCELED")
      .map((item: any) => {
        const days = Math.floor((now.getTime() - new Date(item.openedAt).getTime()) / 86400000);
        const severity = days > 10 ? "CRITICAL" : days > 5 ? "WARNING" : "INFO";
        return {
          id: item.id,
          severity,
          daysOpen: days,
          plate: item.vehicle?.plate,
          site: item.site?.name,
          workshop: item.workshop?.name,
          status: item.status,
          message: days > 10 ? "Fermo critico oltre 10 giorni" : days > 5 ? "Fermo oltre soglia attenzione" : "Fermo monitorato"
        };
      })
      .filter((a: any) => a.severity !== "INFO");

    res.json({ data: alerts.sort((a: any, b: any) => b.daysOpen - a.daysOpen) });
  };

  slaEscalations = async (req: Request, res: Response) => {
    const now = new Date();
    const rows = (await this.useCases.list(req.auth!.tenantId, { skip: 0, take: 1000, sortDir: "desc" })) as any;
    const active = rows.data.filter((item: any) => item.status !== "CLOSED" && item.status !== "CANCELED");
    const data = active
      .map((item: any) => {
        const daysOpen = Math.floor((now.getTime() - new Date(item.openedAt).getTime()) / 86400000);
        const thresholdDays = getSlaThresholdForPriority(item.priority);
        const escalation = this.escalationLevel(daysOpen, thresholdDays);
        return {
          id: item.id,
          plate: item.vehicle?.plate,
          site: item.site?.name,
          workshop: item.workshop?.name,
          priority: item.priority,
          status: item.status,
          daysOpen,
          thresholdDays,
          escalation
        };
      })
      .filter((x: any) => x.escalation !== null)
      .sort((a: any, b: any) => b.daysOpen - a.daysOpen);
    res.json({
      kpis: {
        level1: data.filter((x: any) => x.escalation === "LEVEL_1").length,
        level2: data.filter((x: any) => x.escalation === "LEVEL_2").length,
        level3: data.filter((x: any) => x.escalation === "LEVEL_3").length
      },
      data
    });
  };

  preventiveDue = async (req: Request, res: Response) => {
    const intervalDays = Number(req.query.intervalDays ?? 180);
    const kmWarning = Number(req.query.kmWarning ?? 500);
    const vehicles = await prisma.vehicle.findMany({
      where: { tenantId: req.auth!.tenantId, deletedAt: null, isActive: true },
      include: {
        site: { select: { name: true } },
        stoppages: { where: { deletedAt: null }, orderBy: { openedAt: "desc" }, take: 1, select: { openedAt: true } }
      }
    });
    const now = new Date();
    const data = vehicles
      .map((vehicle) => {
        const reference = vehicle.stoppages[0]?.openedAt ?? vehicle.createdAt;
        const daysFromReference = Math.floor((now.getTime() - reference.getTime()) / 86400000);
        const remaining = intervalDays - daysFromReference;
        const currentKm = (vehicle as any).currentKm ?? null;
        const intervalKm = (vehicle as any).maintenanceIntervalKm ?? null;
        const remainingKm = currentKm !== null && intervalKm !== null ? intervalKm - (currentKm % intervalKm) : null;
        return {
          vehicleId: vehicle.id,
          plate: vehicle.plate,
          brand: vehicle.brand,
          model: vehicle.model,
          site: vehicle.site.name,
          referenceDate: reference.toISOString(),
          intervalDays,
          remainingDays: remaining,
          dueByDays: remaining <= 0,
          currentKm,
          maintenanceIntervalKm: intervalKm,
          remainingKm,
          dueByKm: remainingKm !== null ? remainingKm <= 0 : false,
          dueSoonByKm: remainingKm !== null ? remainingKm > 0 && remainingKm <= kmWarning : false
        };
      })
      .filter((x) => x.remainingDays <= 30 || x.dueByKm || x.dueSoonByKm)
      .sort((a, b) => a.remainingDays - b.remainingDays);
    res.json({
      kpis: {
        dueNowDays: data.filter((x) => x.dueByDays).length,
        dueSoonDays: data.filter((x) => !x.dueByDays && x.remainingDays <= 15).length,
        dueNowKm: data.filter((x) => x.dueByKm).length,
        dueSoonKm: data.filter((x) => x.dueSoonByKm).length
      },
      data
    });
  };
}
