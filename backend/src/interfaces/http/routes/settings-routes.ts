import { Router } from "express";
import { SettingsController } from "../controllers/settings-controller.js";
import { requirePermissions } from "../middlewares/permissions.js";
import { asyncHandler } from "./async-handler.js";

export const settingsRoutes = (controller: SettingsController) => {
  const router = Router();
  router.get("/sla", requirePermissions("stats:read"), asyncHandler(controller.getSla));
  router.put("/sla", requirePermissions("users:write"), asyncHandler(controller.updateSla));
  router.get("/playbooks", requirePermissions("stats:read"), asyncHandler(controller.getPlaybooks));
  router.put("/playbooks", requirePermissions("users:write"), asyncHandler(controller.updatePlaybooks));
  router.get("/reports", requirePermissions("stats:read"), asyncHandler(controller.getReports));
  router.put("/reports", requirePermissions("users:write"), asyncHandler(controller.updateReports));
  router.get("/integrations", requirePermissions("stats:read"), asyncHandler(controller.getIntegrations));
  router.put("/integrations", requirePermissions("users:write"), asyncHandler(controller.updateIntegrations));
  return router;
};
