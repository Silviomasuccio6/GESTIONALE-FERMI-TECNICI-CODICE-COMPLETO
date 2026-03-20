import cron from "node-cron";
import { logger } from "../logging/logger.js";
import { EmailQueueService } from "../email/email-queue-service.js";

export const startEmailQueueCron = (service: EmailQueueService) => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const result = await service.processPending();
      logger.info({ result }, "Email queue cron completed");
    } catch (error) {
      logger.error({ error }, "Email queue cron failed");
    }
  });
};
