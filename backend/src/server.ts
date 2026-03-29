import { createApp, createPlatformApp } from "./app.js";
import { startEmailQueueCron } from "./infrastructure/cron/email-queue-cron.js";
import { startReminderCron } from "./infrastructure/cron/reminder-cron.js";
import { startReportsCron } from "./infrastructure/cron/reports-cron.js";
import { emailQueueCronService, reminderCronUseCase } from "./interfaces/http/routes/index.js";
import { env } from "./shared/config/env.js";

const app = createApp();
app.listen(env.PORT, () => {
  console.log(`API running on http://localhost:${env.PORT}`);
});
const platformApp = createPlatformApp();
platformApp.listen(env.PLATFORM_PORT, env.PLATFORM_BIND_HOST, () => {
  console.log(`Platform API running on http://${env.PLATFORM_BIND_HOST}:${env.PLATFORM_PORT}/platform-api`);
});

startReminderCron(reminderCronUseCase);
startEmailQueueCron(emailQueueCronService);
startReportsCron(emailQueueCronService);
