import { Request, Response } from "express";
import { z } from "zod";
import { AcceptInviteUseCase } from "../../../application/usecases/auth/accept-invite-usecase.js";
import { LoginUseCase } from "../../../application/usecases/auth/login-usecase.js";
import { ManageProfileUseCase } from "../../../application/usecases/auth/manage-profile-usecase.js";
import { RequestPasswordResetUseCase } from "../../../application/usecases/auth/request-password-reset-usecase.js";
import { ResetPasswordUseCase } from "../../../application/usecases/auth/reset-password-usecase.js";
import { SignupUseCase } from "../../../application/usecases/auth/signup-usecase.js";
import { AuthSessionService } from "../../../application/services/auth-session-service.js";
import { AuthThreatDetectionService } from "../../../application/services/auth-threat-detection-service.js";
import { LicensePolicyService } from "../../../application/services/license-policy-service.js";
import { AppError } from "../../../shared/errors/app-error.js";
import {
  acceptInviteSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  updateProfileSchema
} from "../validators/auth-validators.js";

export class AuthController {
  constructor(
    private readonly signupUseCase: SignupUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly acceptInviteUseCase: AcceptInviteUseCase,
    private readonly manageProfileUseCase: ManageProfileUseCase,
    private readonly licensePolicyService: LicensePolicyService,
    private readonly authSessionService: AuthSessionService,
    private readonly authThreatDetectionService: AuthThreatDetectionService
  ) {}

  signup = async (req: Request, res: Response) => {
    const input = signupSchema.parse(req.body);
    const result = await this.signupUseCase.execute(input);
    res.status(201).json(result);
  };

  login = async (req: Request, res: Response) => {
    const input = loginSchema.parse(req.body);
    await this.authThreatDetectionService.assertAllowed(req.ip, input.email);
    try {
      const result = await this.loginUseCase.execute(input, {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
      this.authThreatDetectionService.onSuccess(req.ip, input.email);
      res.json(result);
    } catch (error) {
      await this.authThreatDetectionService.onFailure(req.ip, input.email);
      throw error;
    }
  };

  forgotPassword = async (req: Request, res: Response) => {
    const input = forgotPasswordSchema.parse(req.body);
    const result = await this.requestPasswordResetUseCase.execute(input.email);
    res.json(result);
  };

  resetPassword = async (req: Request, res: Response) => {
    const input = resetPasswordSchema.parse(req.body);
    const result = await this.resetPasswordUseCase.execute(input);
    res.json(result);
  };

  acceptInvite = async (req: Request, res: Response) => {
    const input = acceptInviteSchema.parse(req.body);
    const result = await this.acceptInviteUseCase.execute(input);
    res.json(result);
  };

  me = async (req: Request, res: Response) => {
    const result = await this.manageProfileUseCase.me(req.auth!.userId);
    res.json(result);
  };

  entitlements = async (req: Request, res: Response) => {
    const result = await this.licensePolicyService.getTenantEntitlements(req.auth!.tenantId);
    res.json({
      plan: result.plan,
      priceMonthly: result.priceMonthly,
      features: result.features,
      license: result.license
    });
  };

  updateProfile = async (req: Request, res: Response) => {
    const input = updateProfileSchema.parse(req.body);
    const result = await this.manageProfileUseCase.updateProfile(req.auth!.tenantId, req.auth!.userId, input);
    res.json(result);
  };

  changePassword = async (req: Request, res: Response) => {
    const input = changePasswordSchema.parse(req.body);
    const result = await this.manageProfileUseCase.changePassword(req.auth!.tenantId, req.auth!.userId, input);
    res.json(result);
  };

  licenseStatus = async (req: Request, res: Response) => {
    const result = await this.licensePolicyService.evaluateAccess(req.auth!.tenantId);
    res.json(result.license);
  };

  refresh = async (req: Request, res: Response) => {
    const payload = z.object({ refreshToken: z.string().min(20) }).parse(req.body);
    const refreshed = await this.authSessionService.refresh(payload.refreshToken, req.headers["user-agent"], req.ip);
    const access = await this.licensePolicyService.evaluateAccess(refreshed.user.tenantId);
    if (access.blocked) {
      if (access.reason === "TENANT_INACTIVE") throw new AppError("Tenant disattivato. Contatta l'amministratore.", 403, "TENANT_INACTIVE");
      if (access.reason === "LICENSE_SUSPENDED") throw new AppError("Licenza sospesa. Contatta il supporto.", 403, "LICENSE_SUSPENDED");
      throw new AppError("Licenza scaduta. Rinnova per continuare.", 402, "LICENSE_EXPIRED");
    }
    res.json({
      token: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      refreshExpiresAt: refreshed.refreshExpiresAt,
      user: refreshed.user
    });
  };

  sessions = async (req: Request, res: Response) => {
    const data = await this.authSessionService.list(req.auth!.userId);
    res.json(data);
  };

  revokeSession = async (req: Request, res: Response) => {
    await this.authSessionService.revokeById(req.params.id, req.auth!.userId);
    res.json({ revoked: true });
  };

  revokeAllSessions = async (req: Request, res: Response) => {
    await this.authSessionService.revokeAll(req.auth!.userId);
    res.json({ revoked: true });
  };
}
