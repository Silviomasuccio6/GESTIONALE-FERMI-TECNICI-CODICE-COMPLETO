export type User = {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
};

export type StoppageStatus = "OPEN" | "IN_PROGRESS" | "WAITING_PARTS" | "SOLICITED" | "CLOSED" | "CANCELED";

export type Stoppage = {
  id: string;
  reason: string;
  status: StoppageStatus;
  openedAt: string;
  closedAt?: string | null;
  site: { id: string; name: string };
  vehicle: { id: string; plate: string; brand: string; model: string };
  workshop: { id: string; name: string; whatsapp?: string | null; email?: string | null };
  totalRemindersSent: number;
  photos?: { id: string; filePath: string }[];
};
