#!/usr/bin/env node
/**
 * Build the ZIP of packages/codex-plugin to upload at
 * platform.openai.com/plugins. Validates first, then zips the plugin folder's
 * contents so `.codex-plugin/plugin.json` sits at the root of the archive.
 *
 * Usage: npm run pack:codex-plugin   (writes dist/feednest-plugin-<version>.zip)
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pluginRoot = join(repoRoot, "packages/codex-plugin");

execFileSync(process.execPath, [join(repoRoot, "scripts/validate-codex-plugin.mjs")], {
  stdio: "inherit",
});

const { version } = JSON.parse(
  readFileSync(join(pluginRoot, ".codex-plugin/plugin.json"), "utf8")
);
const outDir = join(repoRoot, "dist");
const zipPath = join(outDir, `feednest-plugin-${version}.zip`);
mkdirSync(outDir, { recursive: true });
rmSync(zipPath, { force: true });

// -X drops extra file attributes; macOS metadata never belongs in the upload.
execFileSync("zip", ["-r", "-X", "-q", zipPath, ".", "-x", "*.DS_Store", "__MACOSX/*"], {
  cwd: pluginRoot,
  stdio: "inherit",
});

const listing = execFileSync("unzip", ["-Z1", zipPath], { encoding: "utf8" });
console.log(listing.trim());
console.log(`\n${zipPath} (${(statSync(zipPath).size / 1024).toFixed(0)} KB)`);
