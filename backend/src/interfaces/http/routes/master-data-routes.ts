import { Router } from "express";
import { MasterDataController } from "../controllers/master-data-controller.js";
import { requirePermissions } from "../middlewares/permissions.js";
import { asyncHandler } from "./async-handler.js";

export const masterDataRoutes = (controller: MasterDataController) => {
  const router = Router();

  router.get("/sites", requirePermissions("sites:read"), asyncHandler(controller.listSites));
  router.post("/sites", requirePermissions("sites:write"), asyncHandler(controller.createSite));
  router.patch("/sites/:id", requirePermissions("sites:write"), asyncHandler(controller.updateSite));
  router.delete("/sites/:id", requirePermissions("sites:write"), asyncHandler(controller.deleteSite));

  router.get("/workshops", requirePermissions("workshops:read"), asyncHandler(controller.listWorkshops));
  router.post("/workshops", requirePermissions("workshops:write"), asyncHandler(controller.createWorkshop));
  router.patch("/workshops/:id", requirePermissions("workshops:write"), asyncHandler(controller.updateWorkshop));
  router.delete("/workshops/:id", requirePermissions("workshops:write"), asyncHandler(controller.deleteWorkshop));

  router.get("/vehicles", requirePermissions("vehicles:read"), asyncHandler(controller.listVehicles));
  router.post("/vehicles", requirePermissions("vehicles:write"), asyncHandler(controller.createVehicle));
  router.patch("/vehicles/:id", requirePermissions("vehicles:write"), asyncHandler(controller.updateVehicle));
  router.delete("/vehicles/:id", requirePermissions("vehicles:write"), asyncHandler(controller.deleteVehicle));

  return router;
};
