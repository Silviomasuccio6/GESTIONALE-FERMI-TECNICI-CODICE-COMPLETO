import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "../../../infrastructure/database/prisma/client.js";
import { sanitizeImageMetadata, validateImageMagic } from "../../../infrastructure/storage/file-security.js";
import { upload } from "../../../infrastructure/storage/multer.js";
import { env } from "../../../shared/config/env.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { requirePermissions } from "../middlewares/permissions.js";
import { asyncHandler } from "./async-handler.js";

export const uploadsRoutes = () => {
  const router = Router();

  const secureFiles = async (files: Express.Multer.File[]) => {
    for (const file of files) {
      try {
        await validateImageMagic(file.path, file.mimetype);
        await sanitizeImageMetadata(file.path);
      } catch (error) {
        await fs.unlink(file.path).catch(() => undefined);
        throw error;
      }
    }
  };

  const unlinkStoredFile = async (filePath: string) => {
    const fullPath = path.resolve(process.cwd(), filePath);
    await fs.unlink(fullPath).catch(() => undefined);
  };

  router.post(
    "/stoppages/:id/photos",
    requirePermissions("stoppages:write"),
    upload.array("files", 8),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth!.tenantId;
      const stoppage = await prisma.stoppage.findFirst({
        where: { id: req.params.id, tenantId, deletedAt: null },
        select: { id: true }
      });
      if (!stoppage) throw new AppError("Fermo non trovato", 404, "NOT_FOUND");

      const files = (req.files ?? []) as Express.Multer.File[];
      await secureFiles(files);

      await prisma.stoppagePhoto.createMany({
        data: files.map((file) => ({
          stoppageId: req.params.id,
          filePath: `${env.UPLOAD_DIR}/${file.filename}`,
          fileName: file.filename,
          mimeType: file.mimetype,
          sizeBytes: file.size
        }))
      });

      res.status(201).json({ uploaded: files.length });
    })
  );

  router.delete(
    "/stoppage-photos/:photoId",
    requirePermissions("stoppages:write"),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth!.tenantId;
      const photo = await prisma.stoppagePhoto.findFirst({
        where: { id: req.params.photoId, stoppage: { tenantId } },
        select: { id: true, filePath: true }
      });
      if (!photo) throw new AppError("Foto non trovata", 404, "NOT_FOUND");

      await prisma.stoppagePhoto.delete({ where: { id: photo.id } });
      await unlinkStoredFile(photo.filePath);
      res.status(204).send();
    })
  );

  router.post(
    "/vehicles/:id/photos",
    requirePermissions("vehicles:write"),
    upload.array("files", 8),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth!.tenantId;
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: req.params.id, tenantId, deletedAt: null },
        select: { id: true }
      });
      if (!vehicle) throw new AppError("Veicolo non trovato", 404, "NOT_FOUND");

      const files = (req.files ?? []) as Express.Multer.File[];
      await secureFiles(files);

      await prisma.vehiclePhoto.createMany({
        data: files.map((file) => ({
          vehicleId: req.params.id,
          filePath: `${env.UPLOAD_DIR}/${file.filename}`,
          fileName: file.filename,
          mimeType: file.mimetype,
          sizeBytes: file.size
        }))
      });

      res.status(201).json({ uploaded: files.length });
    })
  );

  router.delete(
    "/vehicle-photos/:photoId",
    requirePermissions("vehicles:write"),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth!.tenantId;
      const photo = await prisma.vehiclePhoto.findFirst({
        where: { id: req.params.photoId, vehicle: { tenantId } },
        select: { id: true, filePath: true }
      });
      if (!photo) throw new AppError("Foto non trovata", 404, "NOT_FOUND");

      await prisma.vehiclePhoto.delete({ where: { id: photo.id } });
      await unlinkStoredFile(photo.filePath);
      res.status(204).send();
    })
  );

  return router;
};
