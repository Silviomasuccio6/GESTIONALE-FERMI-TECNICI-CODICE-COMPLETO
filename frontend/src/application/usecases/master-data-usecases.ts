import { httpClient } from "../../infrastructure/api/http-client";

const list = (resource: "sites" | "workshops" | "vehicles", params: Record<string, string | number | undefined>) =>
  httpClient.get<{ data: any[]; total: number; page: number; pageSize: number }>(`/master-data/${resource}`, params);
const create = (resource: "sites" | "workshops" | "vehicles", input: unknown) =>
  httpClient.post(`/master-data/${resource}`, input);
const update = (resource: "sites" | "workshops" | "vehicles", id: string, input: unknown) =>
  httpClient.patch(`/master-data/${resource}/${id}`, input);
const remove = (resource: "sites" | "workshops" | "vehicles", id: string) => httpClient.delete(`/master-data/${resource}/${id}`);

export const masterDataUseCases = {
  listSites: (params: Record<string, string | number | undefined>) => list("sites", params),
  createSite: (input: unknown) => create("sites", input),
  updateSite: (id: string, input: unknown) => update("sites", id, input),
  deleteSite: (id: string) => remove("sites", id),

  listWorkshops: (params: Record<string, string | number | undefined>) => list("workshops", params),
  createWorkshop: (input: unknown) => create("workshops", input),
  updateWorkshop: (id: string, input: unknown) => update("workshops", id, input),
  deleteWorkshop: (id: string) => remove("workshops", id),

  listVehicles: (params: Record<string, string | number | undefined>) => list("vehicles", params),
  createVehicle: (input: unknown) => create("vehicles", input),
  updateVehicle: (id: string, input: unknown) => update("vehicles", id, input),
  deleteVehicle: (id: string) => remove("vehicles", id)
};
