import { Router } from "express";
import { AuthController } from "../controllers/auth-controller.js";
import { requireAuth } from "../middlewares/auth.js";
import { authRateLimit } from "../middlewares/auth-rate-limit.js";
import { asyncHandler } from "./async-handler.js";

export const authRoutes = (controller: AuthController) => {
  const router = Router();
  router.post("/signup", asyncHandler(controller.signup));
  router.post("/login", authRateLimit, asyncHandler(controller.login));
  router.post("/forgot-password", authRateLimit, asyncHandler(controller.forgotPassword));
  router.post("/reset-password", authRateLimit, asyncHandler(controller.resetPassword));
  router.post("/accept-invite", authRateLimit, asyncHandler(controller.acceptInvite));
  router.post("/refresh", asyncHandler(controller.refresh));
  router.get("/me", requireAuth, asyncHandler(controller.me));
  router.get("/me/entitlements", requireAuth, asyncHandler(controller.entitlements));
  router.get("/license-status", requireAuth, asyncHandler(controller.licenseStatus));
  router.get("/sessions", requireAuth, asyncHandler(controller.sessions));
  router.post("/sessions/revoke-all", requireAuth, asyncHandler(controller.revokeAllSessions));
  router.post("/sessions/:id/revoke", requireAuth, asyncHandler(controller.revokeSession));
  router.patch("/profile", requireAuth, asyncHandler(controller.updateProfile));
  router.post("/change-password", requireAuth, asyncHandler(controller.changePassword));
  return router;
};
