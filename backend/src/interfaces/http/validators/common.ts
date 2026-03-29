import { z } from "zod";

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(200).optional().default(20),
  search: z.preprocess((value) => (value === "" ? undefined : value), z.string().max(200).optional()),
  sortBy: z.preprocess((value) => (value === "" ? undefined : value), z.string().max(40).optional()),
  sortDir: z.enum(["asc", "desc"]).optional().default("desc")
});
