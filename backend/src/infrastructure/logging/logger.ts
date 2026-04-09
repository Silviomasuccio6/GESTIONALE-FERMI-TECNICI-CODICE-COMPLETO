import pino from "pino";

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: [
      "req.headers.authorization",
      "password",
      "passwordHash",
      "token",
      "refreshToken",
      "currentPassword",
      "newPassword",
      "smtpPass",
      "headers.authorization",
      "*.password",
      "*.passwordHash",
      "*.token",
      "*.refreshToken",
      "*.currentPassword",
      "*.newPassword"
    ],
    remove: true
  }
});
