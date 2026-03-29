import { Request, Response } from "express";
import { ManageSitesUseCases } from "../../../application/usecases/sites/manage-sites-usecases.js";
import { ManageVehiclesUseCases } from "../../../application/usecases/vehicles/manage-vehicles-usecases.js";
import { ManageWorkshopsUseCases } from "../../../application/usecases/workshops/manage-workshops-usecases.js";
import { listQuerySchema } from "../validators/common.js";
import { siteSchema, vehicleSchema, workshopSchema } from "../validators/master-data-validators.js";

export class MasterDataController {
  constructor(
    private readonly sitesUseCases: ManageSitesUseCases,
    private readonly workshopsUseCases: ManageWorkshopsUseCases,
    private readonly vehiclesUseCases: ManageVehiclesUseCases
  ) {}

  listSites = async (req: Request, res: Response) => {
    const query = listQuerySchema.parse(req.query);
    const pagination = { skip: (query.page - 1) * query.pageSize, take: query.pageSize };
    const result = await this.sitesUseCases.list(req.auth!.tenantId, { search: query.search, ...pagination });
    res.json({ ...result, page: query.page, pageSize: query.pageSize });
  };

  createSite = async (req: Request, res: Response) => {
    const input = siteSchema.parse(req.body);
    const result = await this.sitesUseCases.create(req.auth!.tenantId, input);
    res.status(201).json(result);
  };

  updateSite = async (req: Request, res: Response) => {
    const input = siteSchema.partial().parse(req.body);
    const result = await this.sitesUseCases.update(req.auth!.tenantId, req.params.id, input);
    res.json(result);
  };

  deleteSite = async (req: Request, res: Response) => {
    await this.sitesUseCases.delete(req.auth!.tenantId, req.params.id);
    res.status(204).send();
  };

  listWorkshops = async (req: Request, res: Response) => {
    const query = listQuerySchema.parse(req.query);
    const pagination = { skip: (query.page - 1) * query.pageSize, take: query.pageSize };
    const result = await this.workshopsUseCases.list(req.auth!.tenantId, { search: query.search, ...pagination });
    res.json({ ...result, page: query.page, pageSize: query.pageSize });
  };

  createWorkshop = async (req: Request, res: Response) => {
    const input = workshopSchema.parse(req.body);
    const result = await this.workshopsUseCases.create(req.auth!.tenantId, input);
    res.status(201).json(result);
  };

  updateWorkshop = async (req: Request, res: Response) => {
    const input = workshopSchema.partial().parse(req.body);
    const result = await this.workshopsUseCases.update(req.auth!.tenantId, req.params.id, input);
    res.json(result);
  };

  deleteWorkshop = async (req: Request, res: Response) => {
    await this.workshopsUseCases.delete(req.auth!.tenantId, req.params.id);
    res.status(204).send();
  };

  listVehicles = async (req: Request, res: Response) => {
    const query = listQuerySchema.parse(req.query);
    const pagination = { skip: (query.page - 1) * query.pageSize, take: query.pageSize };
    const result = await this.vehiclesUseCases.list(req.auth!.tenantId, { search: query.search, ...pagination });
    res.json({ ...result, page: query.page, pageSize: query.pageSize });
  };

  createVehicle = async (req: Request, res: Response) => {
    const input = vehicleSchema.parse(req.body);
    const result = await this.vehiclesUseCases.create(req.auth!.tenantId, input);
    res.status(201).json(result);
  };

  updateVehicle = async (req: Request, res: Response) => {
    const input = vehicleSchema.partial().parse(req.body);
    const result = await this.vehiclesUseCases.update(req.auth!.tenantId, req.params.id, input);
    res.json(result);
  };

  deleteVehicle = async (req: Request, res: Response) => {
    await this.vehiclesUseCases.delete(req.auth!.tenantId, req.params.id);
    res.status(204).send();
  };
}
