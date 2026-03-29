import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { apiRouter } from "./interfaces/http/routes/index.js";
import { platformAlertService, platformRouter } from "./interfaces/http/routes/platform-index.js";
import { env } from "./shared/config/env.js";
import { errorHandler } from "./interfaces/http/middlewares/error-handler.js";
import { notFoundHandler } from "./interfaces/http/middlewares/not-found.js";
import { createPlatformIpAllowlist } from "./interfaces/http/middlewares/platform-ip-allowlist.js";

const getAllowedOrigins = (corsOrigin: string) => {
  return Array.from(
    new Set(
      [
        corsOrigin,
        env.CORS_ORIGIN,
        env.PLATFORM_CORS_ORIGIN,
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
      ].filter(Boolean)
    )
  );
};

const applyCommon = (app: express.Express, corsOrigin: string) => {
  const allowedOrigins = getAllowedOrigins(corsOrigin);

  app.set("etag", false);
  app.disable("x-powered-by");

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "blob:"],
          connectSrc: ["'self'", ...allowedOrigins],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false
    })
  );

  app.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true
    })
  );

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));
  app.use(morgan("combined"));
};

export const createApp = () => {
  const app = express();
  applyCommon(app, env.CORS_ORIGIN);
  app.use("/uploads", express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));
  app.use("/api", apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

export const createPlatformApp = () => {
  const app = express();
  applyCommon(app, env.PLATFORM_CORS_ORIGIN);
  app.use(createPlatformIpAllowlist(platformAlertService));
  app.get("/platform-api/health", (_req, res) =>
    res.json({ ok: true, service: "fermi-platform-api", timestamp: new Date().toISOString() })
  );
  app.use("/platform-api", platformRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};
