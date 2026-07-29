import { spawnSync } from "node:child_process";

const allowedHighPackages = new Set([
  "archiver",
  "archiver-utils",
  "brace-expansion",
  "exceljs",
  "glob",
  "minimatch",
  "readdir-glob",
  "rimraf",
  "zip-stream",
]);

const allowedAdvisoryUrls = new Set([
  "https://github.com/advisories/GHSA-mh99-v99m-4gvg",
]);

const npmExecutable =
  process.env.npm_execpath && process.env.npm_execpath.trim()
    ? process.env.npm_execpath
    : "npm";
const command =
  npmExecutable === "npm"
    ? { executable: npmExecutable, args: ["audit", "--omit=dev", "--json"] }
    : {
        executable: process.execPath,
        args: [npmExecutable, "audit", "--omit=dev", "--json"],
      };

const result = spawnSync(command.executable, command.args, {
  cwd: process.cwd(),
  encoding: "utf8",
  env: process.env,
  maxBuffer: 16 * 1024 * 1024,
});

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error("Production dependency audit did not return valid JSON.");
  if (result.stderr) {
    console.error(result.stderr.trim());
  }
  process.exit(1);
}

const vulnerabilities = Object.entries(report.vulnerabilities ?? {});
const blocking = vulnerabilities.filter(([, vulnerability]) =>
  ["high", "critical"].includes(vulnerability.severity),
);
const unexpectedPackages = blocking.filter(
  ([name]) => !allowedHighPackages.has(name),
);
const directHighAdvisories = blocking.flatMap(([, vulnerability]) =>
  (vulnerability.via ?? []).filter(
    (entry) =>
      typeof entry === "object" &&
      ["high", "critical"].includes(entry.severity),
  ),
);
const unexpectedAdvisories = directHighAdvisories.filter(
  (advisory) => !allowedAdvisoryUrls.has(advisory.url),
);
const expectedAdvisoryPresent = directHighAdvisories.some((advisory) =>
  allowedAdvisoryUrls.has(advisory.url),
);

if (
  unexpectedPackages.length > 0 ||
  unexpectedAdvisories.length > 0 ||
  (blocking.length > 0 && !expectedAdvisoryPresent)
) {
  console.error("Production dependency audit failed.");
  for (const [name, vulnerability] of blocking) {
    console.error(`- ${name}: ${vulnerability.severity}`);
  }
  process.exit(1);
}

if (blocking.length > 0) {
  console.warn(
    "Production audit passed with the documented ExcelJS transitive exception.",
  );
  console.warn(
    "Review: docs/security/dependency-audit-exceptions.md (deadline 2026-10-31).",
  );
} else {
  console.log("Production dependency audit passed with no high or critical findings.");
}
