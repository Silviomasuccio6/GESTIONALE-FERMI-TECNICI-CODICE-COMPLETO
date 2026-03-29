import { Request, Response } from "express";
import { z } from "zod";
import { GetDashboardStatsUseCase } from "../../../application/usecases/stats/get-dashboard-stats-usecase.js";

export class StatsController {
  constructor(private readonly useCase: GetDashboardStatsUseCase) {}

  private readonly statusEnum = z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.enum(["OPEN", "IN_PROGRESS", "WAITING_PARTS", "SOLICITED", "CLOSED", "CANCELED"]).optional()
  );

  private readonly optionalString = z.preprocess((value) => (value === "" ? undefined : value), z.string().optional());

  private toCsv(rows: Array<Record<string, unknown>>) {
    if (!rows.length) return "";
    const headers = Object.keys(rows[0]);
    const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, "\"\"")}"`;
    const body = rows.map((row) => headers.map((h) => escape(row[h])).join(",")).join("\n");
    return `${headers.join(",")}\n${body}`;
  }

  dashboard = async (req: Request, res: Response) => {
    const result = await this.useCase.dashboardOverview(req.auth!.tenantId);
    res.json(result);
  };

  analytics = async (req: Request, res: Response) => {
    const querySchema = z.object({
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
      siteId: this.optionalString,
      workshopId: this.optionalString,
      status: this.statusEnum,
      plate: this.optionalString,
      brand: this.optionalString,
      model: this.optionalString
    });
    const parsed = querySchema.parse(req.query);
    const result = await this.useCase.analytics(req.auth!.tenantId, {
      dateFrom: parsed.dateFrom ? new Date(parsed.dateFrom) : undefined,
      dateTo: parsed.dateTo ? new Date(parsed.dateTo) : undefined,
      siteId: parsed.siteId,
      workshopId: parsed.workshopId,
      status: parsed.status,
      plate: parsed.plate,
      brand: parsed.brand,
      model: parsed.model
    });
    res.json(result);
  };

  analyticsCsv = async (req: Request, res: Response) => {
    const querySchema = z.object({
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
      siteId: this.optionalString,
      workshopId: this.optionalString,
      status: this.statusEnum,
      plate: this.optionalString,
      brand: this.optionalString,
      model: this.optionalString
    });
    const parsed = querySchema.parse(req.query);
    const result = await this.useCase.analytics(req.auth!.tenantId, {
      dateFrom: parsed.dateFrom ? new Date(parsed.dateFrom) : undefined,
      dateTo: parsed.dateTo ? new Date(parsed.dateTo) : undefined,
      siteId: parsed.siteId,
      workshopId: parsed.workshopId,
      status: parsed.status,
      plate: parsed.plate,
      brand: parsed.brand,
      model: parsed.model
    });

    const rows = [
      ...result.tables.longestOpen.map((x: any) => ({
        section: "LONGEST_OPEN",
        plate: x.plate,
        brand: x.brand,
        model: x.model,
        site: x.site,
        workshop: x.workshop,
        status: x.status,
        priority: x.priority,
        value: x.openDays
      })),
      ...result.tables.topVehiclesDowntime.map((x: any) => ({
        section: "TOP_VEHICLES_DOWNTIME",
        plate: x.plate,
        brand: x.brand,
        model: x.model,
        site: "",
        workshop: "",
        status: "",
        priority: "",
        value: x.openDays
      })),
      ...result.charts.byWorkshop.map((x: any) => ({
        section: "WORKSHOP_VOLUME",
        plate: "",
        brand: "",
        model: "",
        site: "",
        workshop: x.name,
        status: "",
        priority: "",
        value: x.count
      }))
    ];

    const csv = this.toCsv(rows);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=\"analytics-${new Date().toISOString().slice(0, 10)}.csv\"`);
    res.send(csv);
  };

  workshopsHealth = async (req: Request, res: Response) => {
    const querySchema = z.object({
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional()
    });
    const parsed = querySchema.parse(req.query);
    const result = await this.useCase.workshopHealth(
      req.auth!.tenantId,
      parsed.dateFrom ? new Date(parsed.dateFrom) : undefined,
      parsed.dateTo ? new Date(parsed.dateTo) : undefined
    );
    res.json({ data: result });
  };

  teamPerformance = async (req: Request, res: Response) => {
    const querySchema = z.object({
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional()
    });
    const parsed = querySchema.parse(req.query);
    const result = await this.useCase.teamPerformance(
      req.auth!.tenantId,
      parsed.dateFrom ? new Date(parsed.dateFrom) : undefined,
      parsed.dateTo ? new Date(parsed.dateTo) : undefined
    );
    res.json({ data: result });
  };

  aiSuggestions = async (req: Request, res: Response) => {
    const result = await this.useCase.aiSuggestions(req.auth!.tenantId);
    res.json(result);
  };

  workshopsCapacity = async (req: Request, res: Response) => {
    const querySchema = z.object({
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional()
    });
    const parsed = querySchema.parse(req.query);
    const result = await this.useCase.workshopsCapacity(
      req.auth!.tenantId,
      parsed.dateFrom ? new Date(parsed.dateFrom) : undefined,
      parsed.dateTo ? new Date(parsed.dateTo) : undefined
    );
    res.json({ data: result });
  };
}
