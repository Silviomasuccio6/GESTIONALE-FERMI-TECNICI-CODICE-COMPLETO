# Production dependency audit exceptions

## Policy

Fleetum fails CI for every high or critical production dependency advisory
unless it appears in the exact allowlist implemented by
`ops/audit-production-dependencies.mjs`.

An exception must:

1. identify one advisory ID;
2. be restricted to the expected transitive dependency path;
3. include a technical risk assessment;
4. be reviewed whenever the parent package is upgraded;
5. have a review deadline.

## Active exception

### `GHSA-mh99-v99m-4gvg` - `brace-expansion`

- Parent dependency: `exceljs@4.4.0`.
- Scope: the npm aggregate graph rooted at ExcelJS (`archiver`,
  `archiver-utils`, `brace-expansion`, `glob`, `minimatch`, `readdir-glob`,
  `rimraf`, and `zip-stream`) only.
- Fleetum usage: server-side generation of workbooks from fixed application
  templates and tenant-authorized report data.
- Exposure assessment: Fleetum does not pass attacker-controlled glob patterns
  to `brace-expansion`; the vulnerable functionality is not part of the export
  execution path.
- Mitigation: report input validation, tenant authorization, export limits, and
  CI failure if the advisory appears through any dependency outside ExcelJS.
- Review deadline: 2026-10-31, or immediately when ExcelJS publishes a release
  with an updated dependency tree.

Replacing ExcelJS or upgrading its transitive archive stack must be evaluated in
a dedicated change because forced npm overrides currently produce a
non-reproducible lockfile.
