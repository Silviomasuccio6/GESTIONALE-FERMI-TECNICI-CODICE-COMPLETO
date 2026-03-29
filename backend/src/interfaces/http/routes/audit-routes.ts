import { Router } from "express";
import { AuditController } from "../controllers/audit-controller.js";
import { requirePermissions } from "../middlewares/permissions.js";
import { asyncHandler } from "./async-handler.js";

export const auditRoutes = (controller: AuditController) => {
  const router = Router();
  router.get("/logs", requirePermissions("users:read"), asyncHandler(controller.list));
  router.get("/logs/export.csv", requirePermissions("users:read"), asyncHandler(controller.exportCsv));
  return router;
};
