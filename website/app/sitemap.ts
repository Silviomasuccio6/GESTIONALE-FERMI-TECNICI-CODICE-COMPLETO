import type { MetadataRoute } from "next";
import { publicOrigin } from "../lib/site-data";

export const dynamic = "force-static";

const routes = [
  "",
  "/prodotto",
  "/moduli",
  "/soluzioni",
  "/come-funziona",
  "/sicurezza",
  "/prezzi",
  "/chi-siamo",
  "/tour",
  "/demo",
  "/booking-noleggi",
  "/contratti-digitali",
  "/gestionale-flotta",
  "/scadenze-manutenzione",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route, index) => ({
    url: `${publicOrigin}${route}`,
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : route === "/demo" ? 0.9 : 0.8,
  }));
}
