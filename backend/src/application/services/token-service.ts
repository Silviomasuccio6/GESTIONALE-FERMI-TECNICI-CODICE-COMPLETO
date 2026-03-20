import jwt from "jsonwebtoken";
import { env } from "../../shared/config/env.js";
import { JwtPayload } from "../../shared/types/auth.js";

export class TokenService {
  sign(payload: JwtPayload): string {
    return this.signAccess(payload);
  }

  signAccess(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
  }
}
