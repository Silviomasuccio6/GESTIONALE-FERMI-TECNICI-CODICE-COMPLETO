import { RequestHandler, Router } from "express";
import { FeatureKey } from "../../../application/services/feature-entitlements-service.js";
import { AuditController } from "../controllers/audit-controller.js";
import { requirePermissions } from "../middlewares/permissions.js";
import { asyncHandler } from "./async-handler.js";

export const auditRoutes = (
  controller: AuditController,
  requireFeature: (feature: FeatureKey) => RequestHandler
) => {
  const router = Router();
  router.get("/logs", requirePermissions("users:read"), requireFeature("audit_standard"), asyncHandler(controller.list));
  router.get(
    "/logs/export.csv",
    requirePermissions("users:read"),
    requireFeature("audit_advanced"),
    asyncHandler(controller.exportCsv)
  );
  return router;
};
