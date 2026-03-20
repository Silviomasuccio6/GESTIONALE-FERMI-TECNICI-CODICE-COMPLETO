import cron from "node-cron";
import { SendReminderUseCase } from "../../application/usecases/reminders/send-reminder-usecase.js";
import { env } from "../../shared/config/env.js";
import { logger } from "../logging/logger.js";

export const startReminderCron = (useCase: SendReminderUseCase) => {
  cron.schedule(env.CRON_REMINDER_SCHEDULE, async () => {
    try {
      const result = await useCase.automaticRun();
      logger.info({ result }, "Automatic reminder run completed");
    } catch (error) {
      logger.error({ error }, "Automatic reminder run failed");
    }
  });
};
