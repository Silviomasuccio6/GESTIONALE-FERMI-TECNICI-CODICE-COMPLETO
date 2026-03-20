import { AuditLogRepository } from "../../domain/repositories/audit-log-repository.js";

const keyMap = {
  sla: "SETTINGS_SLA",
  playbooks: "SETTINGS_PLAYBOOKS",
  reports: "SETTINGS_REPORTS",
  integrations: "SETTINGS_INTEGRATIONS"
} as const;

const defaults = {
  sla: { LOW: 15, MEDIUM: 10, HIGH: 5, CRITICAL: 2 },
  playbooks: {
    WAITING_PARTS: { enabled: true, reminderEveryDays: 3 },
    SOLICITED: { enabled: true, reminderEveryDays: 2 }
  },
  reports: {
    enabled: false,
    recipients: [],
    frequency: "weekly",
    hour: 8,
    minute: 0,
    reportStyle: "EXECUTIVE"
  },
  integrations: {
    erpWebhookUrl: "",
    telematicsWebhookUrl: "",
    ticketingWebhookUrl: ""
  }
};

type SettingsResource = keyof typeof keyMap;

export class SettingsService {
  constructor(private readonly repository: AuditLogRepository) {}

  async getByResource(tenantId: string, resource: SettingsResource) {
    const row = await this.repository.getLatestByAction(tenantId, resource, keyMap[resource]);
    const details = (row?.details as any) ?? defaults[resource];
    if (details && typeof details === "object" && "__meta" in details) {
      const { __meta, ...clean } = details as any;
      return clean;
    }
    return details;
  }

  async setByResource(tenantId: string, userId: string | undefined, resource: SettingsResource, details: unknown) {
    await this.repository.create({
      tenantId,
      userId,
      action: keyMap[resource],
      resource,
      details
    });
  }
}
