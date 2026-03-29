import { httpClient } from "../../infrastructure/api/http-client";

export const settingsUseCases = {
  getSla: () => httpClient.get<any>("/settings/sla"),
  updateSla: (input: any) => httpClient.put("/settings/sla", input),
  getPlaybooks: () => httpClient.get<any>("/settings/playbooks"),
  updatePlaybooks: (input: any) => httpClient.put("/settings/playbooks", input),
  getReports: () => httpClient.get<any>("/settings/reports"),
  updateReports: (input: any) => httpClient.put("/settings/reports", input),
  getIntegrations: () => httpClient.get<any>("/settings/integrations"),
  updateIntegrations: (input: any) => httpClient.put("/settings/integrations", input)
};
