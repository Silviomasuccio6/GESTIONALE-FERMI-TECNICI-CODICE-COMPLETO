import { Request } from "express";

const normalizeIp = (raw?: string | null) => {
  if (!raw) return "unknown";
  const value = raw.trim();
  if (!value) return "unknown";
  if (value.startsWith("::ffff:")) return value.slice(7);
  return value;
};

export const getClientIp = (req: Request) => {
  const candidates = [req.ip, ...(Array.isArray(req.ips) ? req.ips : []), req.socket.remoteAddress];
  for (const candidate of candidates) {
    const normalized = normalizeIp(candidate);
    if (normalized !== "unknown") return normalized;
  }
  return "unknown";
};

export const toIpAllowlist = (ipsCsv: string) => {
  const dynamic = ipsCsv
    .split(",")
    .map((x) => normalizeIp(x))
    .filter(Boolean);

  return new Set(["127.0.0.1", "::1", "localhost", ...dynamic]);
};
