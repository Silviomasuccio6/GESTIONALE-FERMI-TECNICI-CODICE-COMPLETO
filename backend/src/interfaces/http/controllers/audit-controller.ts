import { Request, Response } from "express";
import { AuditService } from "../../../application/services/audit-service.js";

export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  list = async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(200, Math.max(10, Number(req.query.pageSize ?? 50)));
    const result = await this.auditService.list(req.auth!.tenantId, page, pageSize);
    res.json(result);
  };

  exportCsv = async (req: Request, res: Response) => {
    const rows = await this.auditService.exportRows(req.auth!.tenantId, 5000);
    const headers = ["createdAt", "action", "resource", "resourceId", "userId", "details"];
    const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, "\"\"")}"`;
    const body = rows
      .map((r) => [r.createdAt.toISOString(), r.action, r.resource, r.resourceId ?? "", r.userId ?? "", JSON.stringify(r.details ?? {})].map(escape).join(","))
      .join("\n");
    const csv = `${headers.join(",")}\n${body}`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=\"audit-${new Date().toISOString().slice(0, 10)}.csv\"`);
    res.send(csv);
  };
}
