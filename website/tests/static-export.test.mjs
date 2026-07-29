import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  ANNUAL_DISCOUNT_PERCENT,
  COMMERCIAL_PLAN_CATALOG,
} from "@fleetum/commercial-plan-catalog";

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

const indexableRoutes = [
  "",
  "booking-noleggi",
  "chi-siamo",
  "come-funziona",
  "contratti-digitali",
  "demo",
  "gestionale-flotta",
  "moduli",
  "prezzi",
  "prodotto",
  "scadenze-manutenzione",
  "sicurezza",
  "soluzioni",
  "tour",
];

const noindexRoutes = ["accesso", "cookie", "dpa", "privacy", "termini"];

function routeHtml(route) {
  return path.join(outRoot, route, "index.html");
}

async function text(relativePath) {
  return readFile(path.join(websiteRoot, relativePath), "utf8");
}

async function pngDimensions(relativePath) {
  const bytes = await readFile(path.join(websiteRoot, relativePath));
  assert.equal(bytes.toString("ascii", 1, 4), "PNG");
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
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

test("emits canonical, social and WebPage metadata on every indexable route", async () => {
  const homeHtml = await readFile(routeHtml(""), "utf8");
  const buildIsIndexable =
    /<meta name="robots" content="index, follow"/.test(homeHtml);

  await Promise.all(
    indexableRoutes.map(async (route) => {
      const html = await readFile(routeHtml(route), "utf8");
      const expectedUrl = `https://fleetum.it/${route ? `${route}/` : ""}`;

      assert.match(
        html,
        new RegExp(
          `<link rel="canonical" href="${expectedUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
        ),
        `${route || "/"} must expose its absolute canonical URL`,
      );
      assert.match(
        html,
        buildIsIndexable
          ? /<meta name="robots" content="index, follow"/
          : /<meta name="robots" content="noindex, nofollow"/,
        `${route || "/"} must use the same indexing mode as the home page`,
      );
      assert.match(html, /property="og:image" content="https:\/\/fleetum\.it\/brand\/fleetum-social-preview\.png"/);
      assert.match(html, /"@type":"WebPage"/);
      assert.match(
        html,
        new RegExp(
          `"url":"${expectedUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
        ),
        `${route || "/"} must align WebPage schema with its canonical URL`,
      );
    }),
  );
});

test("keeps legal drafts and application access pages out of the index", async () => {
  await Promise.all(
    noindexRoutes.map(async (route) => {
      const html = await readFile(routeHtml(route), "utf8");
      assert.match(
        html,
        /<meta name="robots" content="noindex, (?:follow|nofollow)"/,
        `/${route} must remain noindex until professional review is complete`,
      );
    }),
  );
});

test("keeps application access on the existing Fleetum SPA", async () => {
  const [accessPage, siteData, caddyfile, platformHtml] = await Promise.all([
    readFile(routeHtml("accesso"), "utf8"),
    text("lib/site-data.ts"),
    readFile(
      path.join(websiteRoot, "..", "deploy", "caddy", "Caddyfile"),
      "utf8",
    ),
    readFile(
      path.join(websiteRoot, "..", "frontend", "platform.html"),
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
  assert.match(
    caddyfile,
    /handle \{\s+header X-Robots-Tag "noindex, nofollow, noarchive"[\s\S]*?try_files \{path\} \/spa\.html/,
  );
  assert.match(
    caddyfile,
    /platform\.fleetum\.it \{[\s\S]*?header X-Robots-Tag "noindex, nofollow, noarchive"/,
  );
  assert.match(
    platformHtml,
    /<meta name="robots" content="noindex, nofollow, noarchive" \/>/,
  );
});

test("exports SEO discovery files without indexing private app routes", async () => {
  const [robots, sitemap, llms] = await Promise.all([
    readFile(path.join(outRoot, "robots.txt"), "utf8"),
    readFile(path.join(outRoot, "sitemap.xml"), "utf8"),
    readFile(path.join(outRoot, "llms.txt"), "utf8"),
  ]);

  assert.match(robots, /User-Agent:/i);
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, url]) => url,
  );
  assert.deepEqual(
    [...sitemapUrls].sort(),
    indexableRoutes.map(
      (route) => `https://fleetum.it/${route ? `${route}/` : ""}`,
    ).sort(),
  );
  assert.ok(
    noindexRoutes.every(
      (route) => !sitemapUrls.includes(`https://fleetum.it/${route}`),
    ),
  );
  assert.match(llms, /Fleetum è un software SaaS B2B/);
});

test("uses the shared commercial catalog for public monthly and annual pricing", async () => {
  const [home, pricingPage, pricingComponent] = await Promise.all([
    readFile(routeHtml(""), "utf8"),
    readFile(routeHtml("prezzi"), "utf8"),
    text("components/pricing-experience.tsx"),
  ]);

  for (const plan of Object.values(COMMERCIAL_PLAN_CATALOG)) {
    const monthlyPrice = String(plan.monthlyPriceCents / 100);
    assert.match(home, new RegExp(`<strong>${monthlyPrice}</strong>`));
    assert.match(pricingPage, new RegExp(`<strong>${monthlyPrice}`));
  }

  assert.equal(ANNUAL_DISCOUNT_PERCENT, 15);
  assert.match(pricingComponent, /plan\.annualPrice/);
  assert.doesNotMatch(pricingComponent, /\* 0\.85/);
  assert.doesNotMatch(home, /<strong>129<\/strong>/);
  assert.doesNotMatch(pricingPage, /<strong>129/);
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

  assert.deepEqual(
    await pngDimensions("public/brand/fleetum-social-preview.png"),
    { width: 1200, height: 630 },
  );
  assert.deepEqual(
    await pngDimensions("public/brand/fleetum-favicon-light.png"),
    { width: 64, height: 64 },
  );
  assert.deepEqual(
    await pngDimensions("public/brand/fleetum-favicon-dark.png"),
    { width: 64, height: 64 },
  );
  assert.deepEqual(
    await pngDimensions("public/brand/fleetum-apple-touch-icon.png"),
    { width: 180, height: 180 },
  );
});
