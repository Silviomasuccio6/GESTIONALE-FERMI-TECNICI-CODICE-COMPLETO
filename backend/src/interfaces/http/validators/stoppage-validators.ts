import { z } from "zod";

export const stoppageSchema = z.object({
  siteId: z.string().min(1),
  vehicleId: z.string().min(1),
  workshopId: z.string().min(1),
  reason: z.string().min(3),
  notes: z.preprocess((value) => (value === "" ? undefined : value), z.string().optional()),
  status: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.enum(["OPEN", "IN_PROGRESS", "WAITING_PARTS", "SOLICITED", "CLOSED", "CANCELED"]).optional()
  ),
  priority: z.preprocess((value) => (value === "" ? undefined : value), z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional()),
  assignedToUserId: z.preprocess((value) => (value === "" ? null : value), z.string().optional().nullable()),
  estimatedCostPerDay: z.number().min(0).optional().nullable(),
  openedAt: z.string().datetime(),
  closedAt: z.preprocess((value) => (value === "" ? null : value), z.string().datetime().optional().nullable()),
  closureSummary: z.preprocess((value) => (value === "" ? null : value), z.string().optional().nullable()),
  reminderAfterDays: z.number().int().min(1).max(365).optional().nullable(),
  workshopEmailSnapshot: z.preprocess((value) => (value === "" ? null : value), z.string().email().optional().nullable()),
  workshopPhoneSnapshot: z.preprocess((value) => (value === "" ? null : value), z.string().optional().nullable()),
  workshopWhatsappSnapshot: z.preprocess((value) => (value === "" ? null : value), z.string().optional().nullable())
});
