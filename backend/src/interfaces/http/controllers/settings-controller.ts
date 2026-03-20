import { Request, Response } from "express";
import { SettingsService } from "../../../application/services/settings-service.js";
import {
  integrationsSettingsSchema,
  playbooksSettingsSchema,
  reportsSettingsSchema,
  slaSettingsSchema
} from "../validators/settings-validators.js";

export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  getSla = async (req: Request, res: Response) => {
    const data = await this.settingsService.getByResource(req.auth!.tenantId, "sla");
    res.json(data);
  };

  updateSla = async (req: Request, res: Response) => {
    const payload = slaSettingsSchema.parse(req.body);
    await this.settingsService.setByResource(req.auth!.tenantId, req.auth?.userId, "sla", payload);
    res.json({ updated: true });
  };

  getPlaybooks = async (req: Request, res: Response) => {
    const data = await this.settingsService.getByResource(req.auth!.tenantId, "playbooks");
    res.json(data);
  };

  updatePlaybooks = async (req: Request, res: Response) => {
    const payload = playbooksSettingsSchema.parse(req.body);
    await this.settingsService.setByResource(req.auth!.tenantId, req.auth?.userId, "playbooks", payload);
    res.json({ updated: true });
  };

  getReports = async (req: Request, res: Response) => {
    const data = await this.settingsService.getByResource(req.auth!.tenantId, "reports");
    res.json(data);
  };

  updateReports = async (req: Request, res: Response) => {
    const payload = reportsSettingsSchema.parse(req.body);
    await this.settingsService.setByResource(req.auth!.tenantId, req.auth?.userId, "reports", payload);
    res.json({ updated: true });
  };

  getIntegrations = async (req: Request, res: Response) => {
    const data = await this.settingsService.getByResource(req.auth!.tenantId, "integrations");
    res.json(data);
  };

  updateIntegrations = async (req: Request, res: Response) => {
    const payload = integrationsSettingsSchema.parse(req.body);
    await this.settingsService.setByResource(req.auth!.tenantId, req.auth?.userId, "integrations", payload);
    res.json({ updated: true });
  };
}
