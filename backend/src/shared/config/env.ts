import "dotenv/config";

const required = (name: string, fallback?: string) => {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
};

const toInt = (value: string, name: string) => {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`Invalid number for ${name}: ${value}`);
  return n;
};

const toBool = (value: string) => ["1", "true", "yes", "on"].includes(value.toLowerCase());

const toCsvList = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const JWT_SECRET = required("JWT_SECRET");
const PLATFORM_JWT_SECRET = required("PLATFORM_JWT_SECRET");

if (JWT_SECRET === PLATFORM_JWT_SECRET) {
  throw new Error("PLATFORM_JWT_SECRET must be different from JWT_SECRET");
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: toInt(process.env.PORT ?? "4000", "PORT"),
  PLATFORM_PORT: toInt(process.env.PLATFORM_PORT ?? "4100", "PLATFORM_PORT"),
  PLATFORM_BIND_HOST: process.env.PLATFORM_BIND_HOST ?? "127.0.0.1",

  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "1d",
  PLATFORM_JWT_SECRET,
  PLATFORM_JWT_EXPIRES_IN: process.env.PLATFORM_JWT_EXPIRES_IN ?? "15m",

  APP_URL: process.env.APP_URL ?? "http://localhost:5173",
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  PLATFORM_CORS_ORIGIN: process.env.PLATFORM_CORS_ORIGIN ?? "http://localhost:5174",

  UPLOAD_DIR: process.env.UPLOAD_DIR ?? "uploads",

  SMTP_HOST: required("SMTP_HOST"),
  SMTP_PORT: toInt(process.env.SMTP_PORT ?? "465", "SMTP_PORT"),
  SMTP_SECURE: toBool(process.env.SMTP_SECURE ?? "true"),
  SMTP_USER: required("SMTP_USER"),
  SMTP_PASS: required("SMTP_PASS"),
  SMTP_FROM: process.env.SMTP_FROM ?? "",

  CRON_REMINDER_SCHEDULE: process.env.CRON_REMINDER_SCHEDULE ?? "*/10 * * * *",
  SLA_PRIORITY_THRESHOLDS:
    process.env.SLA_PRIORITY_THRESHOLDS ?? '{"LOW":15,"MEDIUM":10,"HIGH":5,"CRITICAL":2}',

  PLATFORM_ADMIN_EMAIL: required("PLATFORM_ADMIN_EMAIL"),
  PLATFORM_ADMIN_PASSWORD: required("PLATFORM_ADMIN_PASSWORD"),
  PLATFORM_ALLOWED_IPS_CSV: process.env.PLATFORM_ALLOWED_IPS ?? "",
  PLATFORM_ALERT_EMAILS: toCsvList(process.env.PLATFORM_ALERT_EMAILS),
  PLATFORM_LOGIN_MAX_ATTEMPTS: toInt(process.env.PLATFORM_LOGIN_MAX_ATTEMPTS ?? "5", "PLATFORM_LOGIN_MAX_ATTEMPTS"),
  PLATFORM_LOGIN_WINDOW_MS: toInt(process.env.PLATFORM_LOGIN_WINDOW_MS ?? String(15 * 60 * 1000), "PLATFORM_LOGIN_WINDOW_MS"),
  PLATFORM_LOGIN_LOCK_MS: toInt(process.env.PLATFORM_LOGIN_LOCK_MS ?? String(30 * 60 * 1000), "PLATFORM_LOGIN_LOCK_MS")
} as const;
