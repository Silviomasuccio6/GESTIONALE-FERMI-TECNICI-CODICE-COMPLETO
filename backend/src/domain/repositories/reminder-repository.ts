export interface ReminderRepository {
  create(input: {
    tenantId: string;
    stoppageId: string;
    type: string;
    channel: "EMAIL" | "WHATSAPP";
    recipient: string;
    subject?: string;
    body: string;
    success?: boolean;
    errorMessage?: string;
  }): Promise<void>;
}
