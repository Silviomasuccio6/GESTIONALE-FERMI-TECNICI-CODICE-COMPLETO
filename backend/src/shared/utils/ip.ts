import { Request } from "express";

const normalizeIp = (raw: string) => {
  if (!raw) return "unknown";
  const value = raw.trim();
  if (value.startsWith("::ffff:")) return value.slice(7);
  return value;
};

export const getClientIp = (req: Request) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return normalizeIp(forwarded.split(",")[0] ?? "");
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return normalizeIp(forwarded[0]);
  }
  return normalizeIp(req.ip || req.socket.remoteAddress || "");
};

export const toIpAllowlist = (ipsCsv: string) => {
  const dynamic = ipsCsv
    .split(",")
    .map((x) => normalizeIp(x))
    .filter(Boolean);

  return new Set(["127.0.0.1", "::1", "localhost", ...dynamic]);
};
