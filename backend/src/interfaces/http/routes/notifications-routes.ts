import { Router } from "express";
import { NotificationsController } from "../controllers/notifications-controller.js";
import { requirePermissions } from "../middlewares/permissions.js";
import { asyncHandler } from "./async-handler.js";

export const notificationsRoutes = (controller: NotificationsController) => {
  const router = Router();
  router.get("/inbox", requirePermissions("dashboard:read"), asyncHandler(controller.inbox));
  router.get("/stream", requirePermissions("dashboard:read"), asyncHandler(controller.stream));
  return router;
};
