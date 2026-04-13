import { Request, Response } from "express";
import { ManageUsersUseCases } from "../../../application/usecases/users/manage-users-usecases.js";
import { createUserSchema, inviteUserSchema, updateUserRoleSchema, updateUserSchema } from "../validators/users-validators.js";

export class UsersController {
  constructor(private readonly useCases: ManageUsersUseCases) {}

  list = async (req: Request, res: Response) => {
    const users = await this.useCases.list(req.auth!.tenantId);
    res.json({ data: users });
  };

  listRoles = async (_req: Request, res: Response) => {
    const roles = await this.useCases.listRoles();
    res.json({ data: roles });
  };

  create = async (req: Request, res: Response) => {
    const input = createUserSchema.parse(req.body);
    const user = await this.useCases.create(req.auth!.tenantId, input, {
      userId: req.auth!.userId,
      roles: req.auth!.roles ?? []
    });
    res.status(201).json(user);
  };

  invite = async (req: Request, res: Response) => {
    const input = inviteUserSchema.parse(req.body);
    const result = await this.useCases.invite(req.auth!.tenantId, input, {
      userId: req.auth!.userId,
      roles: req.auth!.roles ?? []
    });
    res.status(201).json(result);
  };

  update = async (req: Request, res: Response) => {
    const input = updateUserSchema.parse(req.body);
    const user = await this.useCases.updateProfile(req.auth!.tenantId, req.params.id, input, {
      userId: req.auth!.userId,
      roles: req.auth!.roles ?? []
    });
    res.json(user);
  };

  updateRole = async (req: Request, res: Response) => {
    const input = updateUserRoleSchema.parse(req.body);
    const user = await this.useCases.setRole(req.auth!.tenantId, req.params.id, input.roleKey, {
      userId: req.auth!.userId,
      roles: req.auth!.roles ?? []
    });
    res.json(user);
  };

  remove = async (req: Request, res: Response) => {
    await this.useCases.remove(req.auth!.tenantId, req.params.id, {
      userId: req.auth!.userId,
      roles: req.auth!.roles ?? []
    });
    res.status(204).send();
  };
}
