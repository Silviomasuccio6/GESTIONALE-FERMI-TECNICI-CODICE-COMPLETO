import { Router } from "express";
import { importUpload } from "../../../infrastructure/storage/import-upload.js";
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
  router.post(
    "/vehicles/import",
    requirePermissions("vehicles:write"),
    importUpload.single("file"),
    asyncHandler(controller.importVehicles)
  );
  router.post("/vehicles", requirePermissions("vehicles:write"), asyncHandler(controller.createVehicle));
  router.patch("/vehicles/:id", requirePermissions("vehicles:write"), asyncHandler(controller.updateVehicle));
  router.delete("/vehicles/:id", requirePermissions("vehicles:write"), asyncHandler(controller.deleteVehicle));
  router.get("/vehicle-deadlines", requirePermissions("vehicles:read"), asyncHandler(controller.listVehicleDeadlines));
  router.post(
    "/vehicle-deadlines/calendar-sync",
    requirePermissions("vehicles:write"),
    asyncHandler(controller.syncVehicleDeadlinesCalendar)
  );
  router.get("/vehicle-maintenances", requirePermissions("vehicles:read"), asyncHandler(controller.listVehicleMaintenances));
  router.get("/vehicle-maintenances/export.csv", requirePermissions("vehicles:read"), asyncHandler(controller.exportVehicleMaintenancesCsv));
  router.get(
    "/vehicle-maintenances/export.xlsx",
    requirePermissions("vehicles:read"),
    asyncHandler(controller.exportVehicleMaintenancesXlsx)
  );
  router.post("/vehicle-maintenances", requirePermissions("vehicles:write"), asyncHandler(controller.createVehicleMaintenance));
  router.patch("/vehicle-maintenances/:id", requirePermissions("vehicles:write"), asyncHandler(controller.updateVehicleMaintenance));
  router.delete("/vehicle-maintenances/:id", requirePermissions("vehicles:write"), asyncHandler(controller.deleteVehicleMaintenance));

  return router;
};
