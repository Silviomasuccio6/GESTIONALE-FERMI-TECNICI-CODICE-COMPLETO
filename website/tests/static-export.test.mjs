import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const websiteRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const outRoot = path.join(websiteRoot, "out");

const publicRoutes = [
  "",
  "accesso",
  "booking-noleggi",
  "chi-siamo",
  "come-funziona",
  "contratti-digitali",
  "cookie",
  "demo",
  "dpa",
  "gestionale-flotta",
  "moduli",
  "prezzi",
  "privacy",
  "prodotto",
  "scadenze-manutenzione",
  "sicurezza",
  "soluzioni",
  "termini",
  "tour",
];

function routeHtml(route) {
  return path.join(outRoot, route, "index.html");
}

async function text(relativePath) {
  return readFile(path.join(websiteRoot, relativePath), "utf8");
}

test("exports every Fleetum marketing route as static HTML", async () => {
  await Promise.all(publicRoutes.map((route) => access(routeHtml(route))));

  const home = await readFile(routeHtml(""), "utf8");
  assert.match(
    home,
    /<title>Fleetum — Il sistema operativo per autonoleggi moderni<\/title>/i,
  );
  assert.match(home, /autonoleggi moderni/i);
  assert.match(home, /href="\/demo\/?"/);
  assert.match(home, /fleetum-social-preview\.png/);
  assert.doesNotMatch(home, /codex-preview|Building your site/i);
});

test("keeps application access on the existing Fleetum SPA", async () => {
  const [accessPage, siteData, caddyfile] = await Promise.all([
    readFile(routeHtml("accesso"), "utf8"),
    text("lib/site-data.ts"),
    readFile(
      path.join(websiteRoot, "..", "deploy", "caddy", "Caddyfile"),
      "utf8",
    ),
  ]);

  assert.match(accessPage, /href="https:\/\/fleetum\.it\/login"/);
  assert.match(siteData, /https:\/\/fleetum\.it\/login/);
  const marketingRoutes = caddyfile.match(
    /@marketing \{[\s\S]*?handle @marketing/,
  )?.[0];
  assert.ok(marketingRoutes);
  assert.doesNotMatch(
    marketingRoutes,
    /\s\/(?:login|dashboard|booking)(?:\s|\/|\*)/,
  );
  assert.match(caddyfile, /\/srv\/fleetum-website/);
  assert.match(caddyfile, /\/srv\/fleetum/);
  assert.match(
    caddyfile,
    /redir @legacy_software_autonoleggio \/prodotto 308/,
  );
  assert.match(
    caddyfile,
    /redir @legacy_contracts \/contratti-digitali 308/,
  );
  assert.match(
    caddyfile,
    /redir @legacy_profitability \/gestionale-flotta 308/,
  );
});

test("exports SEO discovery files without indexing private app routes", async () => {
  const [robots, sitemap, llms] = await Promise.all([
    readFile(path.join(outRoot, "robots.txt"), "utf8"),
    readFile(path.join(outRoot, "sitemap.xml"), "utf8"),
    readFile(path.join(outRoot, "llms.txt"), "utf8"),
  ]);

  assert.match(robots, /User-Agent:/i);
  assert.match(sitemap, /https:\/\/fleetum\.it\/prodotto/);
  assert.match(sitemap, /https:\/\/fleetum\.it\/demo/);
  assert.doesNotMatch(sitemap, /https:\/\/fleetum\.it\/login/);
  assert.doesNotMatch(sitemap, /https:\/\/fleetum\.it\/dashboard/);
  assert.match(llms, /Fleetum è un software SaaS B2B/);
});

test("keeps demo submission connected to the public API with consent-aware analytics", async () => {
  const [demoPage, demoForm, analytics, publicApi] = await Promise.all([
    readFile(routeHtml("demo"), "utf8"),
    text("components/demo-form.tsx"),
    text("lib/public-analytics.ts"),
    text("lib/public-api.ts"),
  ]);

  assert.match(demoPage, /Nome e cognome/);
  assert.match(demoPage, /Email di lavoro/);
  assert.match(demoForm, /\/public\/demo-request/);
  assert.match(demoForm, /new URLSearchParams\(window\.location\.search\)/);
  assert.match(demoForm, /name="websiteUrl"/);
  assert.match(analytics, /\/public\/analytics\/event/);
  assert.match(publicApi, /hasAnalyticsConsent/);
  assert.match(publicApi, /isDoNotTrackEnabled/);
  assert.doesNotMatch(demoForm, /platform-api/);
});

test("emits hashed Next assets and production-ready brand files", async () => {
  const nextEntries = await readdir(path.join(outRoot, "_next"));
  assert.ok(nextEntries.length > 0);

  await Promise.all([
    access(path.join(outRoot, "brand", "fleetum-logo-on-dark.webp")),
    access(path.join(outRoot, "brand", "fleetum-logo-on-light.webp")),
    access(path.join(outRoot, "brand", "fleetum-logo-header.webp")),
    access(path.join(outRoot, "brand", "fleetum-favicon-dark.png")),
    access(path.join(outRoot, "brand", "fleetum-favicon-light.png")),
    access(path.join(outRoot, "brand", "fleetum-social-preview.png")),
  ]);
});
