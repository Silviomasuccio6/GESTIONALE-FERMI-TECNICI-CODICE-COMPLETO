export type JwtPayload = {
  userId: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  sessionId?: string;
  tokenType?: "access" | "platform";
  platformAdmin?: boolean;
};

export type AuthenticatedUser = JwtPayload & {
  email: string;
  fullName: string;
};
