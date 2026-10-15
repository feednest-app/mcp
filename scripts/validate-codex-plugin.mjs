#!/usr/bin/env node
/**
 * Check packages/codex-plugin against the limits of the plugin directory
 * shared by ChatGPT and Codex, so the ZIP uploaded to platform.openai.com
 * passes the automated checks the first time.
 *
 * The rules come from developers.openai.com/plugins/deploy/submission and
 * /plugins/build/plugins: listing fields and their lengths, the review test
 * cases (exactly five positive and three negative), at most three starter
 * prompts, brand colors with 2:1 contrast on their theme, an MCP config with
 * OAuth and no headers, assets that are square and small enough, and nothing
 * the directory refuses (hooks, app references, credentials in the package).
 *
 * Usage: node scripts/validate-codex-plugin.mjs   (exit code 1 on any problem)
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** The plugin folder that becomes the ZIP. */
export const CODEX_PLUGIN_ROOT = join(repoRoot, "packages/codex-plugin");

/**
 * Tools defined in shared-tool-defs that the hosted MCP server does not
 * register. Mirrors WITHHELD_MCP_TOOLS in the FeedNest app
 * (src/lib/mcp/exposed-tools.ts): a test case must not name them.
 */
const WITHHELD_TOOLS = new Set(["text_to_speech"]);

const MAX_ASSET_BYTES = 5 * 1024 * 1024;

/** Keys the directory rejects inside the package: credentials go in the dashboard. */
const FORBIDDEN_KEYS = new Set([
  "test_credentials",
  "reviewer_instructions",
  "clientSecret",
  "client_secret",
  "apps",
  "hooks",
]);

/** Tool names the hosted MCP server exposes, read from shared-tool-defs. */
export function readExposedToolNames() {
  const source = readFileSync(
    join(repoRoot, "packages/shared-tool-defs/src/tools.ts"),
    "utf8"
  );
  const names = [...source.matchAll(/^\s+name: "([a-z_]+)",$/gm)].map(
    (match) => match[1]
  );
  return new Set(names.filter((name) => !WITHHELD_TOOLS.has(name)));
}

/** Collect every key in a JSON value, at any depth. */
function allKeys(value, keys = []) {
  if (Array.isArray(value)) {
    for (const item of value) {
      allKeys(item, keys);
    }
  } else if (value && typeof value === "object") {
    for (const [key, inner] of Object.entries(value)) {
      keys.push(key);
      allKeys(inner, keys);
    }
  }
  return keys;
}

/** Width and height of a PNG from its IHDR chunk, or null for other files. */
function pngSize(path) {
  const buffer = readFileSync(path);
  if (buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    return null;
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

/**
 * Numeric width/height and viewBox size of an SVG's root element. Values with
 * units other than px count as missing, since the directory wants numbers.
 */
function svgSize(path) {
  const tag = readFileSync(path, "utf8").match(/<svg\b[^>]*>/i)?.[0] ?? "";
  const attribute = (name) =>
    tag.match(new RegExp(`\\s${name}="([^"]*)"`, "i"))?.[1];
  const numeric = (value) =>
    value && /^\d+(\.\d+)?(px)?$/.test(value.trim())
      ? Number.parseFloat(value)
      : null;
  const box =
    attribute("viewBox")
      ?.trim()
      .split(/[\s,]+/)
      .map(Number) ?? [];
  return {
    width: numeric(attribute("width")),
    height: numeric(attribute("height")),
    boxWidth: box[2] ?? null,
    boxHeight: box[3] ?? null,
  };
}

/** WCAG relative luminance of a #RRGGBB color. */
function luminance(hex) {
  const [red, green, blue] = [1, 3, 5].map((start) => {
    const channel = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.040_45
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** WCAG contrast ratio between two #RRGGBB colors, from 1 to 21. */
export function contrastRatio(first, second) {
  const [lighter, darker] = [luminance(first), luminance(second)].sort(
    (a, b) => b - a
  );
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Validate a plugin folder for the directory.
 *
 * @param {string} pluginRoot - Folder holding `.codex-plugin/plugin.json`.
 * @param {Set<string>} exposedTools - Tools a test case may name.
 * @returns {string[]} One message per problem; empty when the package is ready.
 */
export function validateCodexPlugin(pluginRoot, exposedTools) {
  const problems = [];
  const fail = (message) => problems.push(message);

  const readJson = (relativePath) => {
    const path = join(pluginRoot, relativePath);
    if (!existsSync(path)) {
      fail(`${relativePath} is missing`);
      return null;
    }
    try {
      return JSON.parse(readFileSync(path, "utf8"));
    } catch (error) {
      fail(`${relativePath} is not valid JSON: ${error.message}`);
      return null;
    }
  };

  const checkText = (label, value, max) => {
    if (value === undefined || value === null || value === "") {
      fail(`${label} is required`);
    } else if (typeof value !== "string") {
      fail(`${label} must be a string`);
    } else if (max && value.length > max) {
      fail(`${label} is ${value.length} characters, the limit is ${max}`);
    }
  };

  const checkHttpsUrl = (label, value) => {
    try {
      if (new URL(value).protocol !== "https:") {
        fail(`${label} must use https`);
      }
    } catch {
      fail(`${label} must be an https URL`);
    }
  };

  /** Resolve a ./ path inside the plugin, or record why it cannot be used. */
  const resolveAsset = (label, relativePath) => {
    if (
      typeof relativePath !== "string" ||
      !relativePath.startsWith("./") ||
      relativePath.split("/").includes("..")
    ) {
      fail(`${label} must be a ./ path inside the plugin`);
      return null;
    }
    const path = join(pluginRoot, relativePath);
    if (!existsSync(path)) {
      fail(`${label} points to ${relativePath}, which does not exist`);
      return null;
    }
    return path;
  };

  const checkPngSize = (label, path) => {
    const size = pngSize(path);
    if (!size) {
      return;
    }
    if (size.width !== size.height) {
      fail(`${label} must be square, it is ${size.width}x${size.height}`);
    }
    if (size.width < 48) {
      fail(`${label} must be at least 48 by 48 pixels`);
    }
    if (size.width > 4096) {
      fail(`${label} must be at most 4096 pixels a side`);
    }
  };

  const checkSvgSize = (label, path) => {
    const { width, height, boxWidth, boxHeight } = svgSize(path);
    const squareSize = width !== null && width === height && width >= 48;
    const squareBox =
      boxWidth !== null && boxWidth === boxHeight && boxWidth >= 48;
    if (!(squareSize || squareBox)) {
      fail(
        `${label} needs square numeric dimensions or a square viewBox of at least 48 by 48`
      );
    }
  };

  const checkAsset = (label, relativePath) => {
    const path = resolveAsset(label, relativePath);
    if (!path) {
      return;
    }
    if (!/\.(png|jpe?g|webp|svg)$/i.test(path)) {
      fail(`${label} must be PNG, JPEG, WebP or SVG`);
    }
    if (statSync(path).size > MAX_ASSET_BYTES) {
      fail(`${label} is larger than 5 MiB`);
    }
    if (/\.png$/i.test(path)) {
      checkPngSize(label, path);
    } else if (/\.svg$/i.test(path)) {
      checkSvgSize(label, path);
    }
  };

  const checkBrandColor = (ui, key, background, backgroundName) => {
    const color = ui[key];
    if (color === undefined) {
      return;
    }
    if (typeof color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(color)) {
      fail(`interface.${key} must be a #RRGGBB color`);
      return;
    }
    const ratio = contrastRatio(color, background);
    if (ratio < 2) {
      fail(
        `interface.${key} ${color} has ${ratio.toFixed(2)}:1 contrast against ${backgroundName}, the minimum is 2:1`
      );
    }
  };

  const checkDefaultPrompts = (value) => {
    const prompts = value === undefined ? [] : [value].flat();
    if (prompts.length > 3) {
      fail(
        `interface.defaultPrompt has ${prompts.length} prompts, the limit is 3`
      );
    }
    if (new Set(prompts).size !== prompts.length) {
      fail("interface.defaultPrompt repeats a prompt");
    }
    for (const prompt of prompts) {
      checkText("a default prompt", prompt, 128);
      if (typeof prompt === "string" && prompt.includes("@")) {
        fail(`default prompt "${prompt}" must not @mention an app`);
      }
    }
  };

  const checkTestCases = (review) => {
    const positive = review?.test_cases?.positive ?? [];
    const negative = review?.test_cases?.negative ?? [];
    if (positive.length !== 5) {
      fail(
        `review needs exactly 5 positive test cases, found ${positive.length}`
      );
    }
    if (negative.length !== 3) {
      fail(
        `review needs exactly 3 negative test cases, found ${negative.length}`
      );
    }
    for (const [index, testCase] of positive.entries()) {
      const label = `positive test case ${index + 1}`;
      checkText(`${label} description`, testCase.description, 4000);
      checkText(`${label} prompt`, testCase.prompt);
      checkText(`${label} tools_triggered`, testCase.tools_triggered);
      checkText(`${label} expected_behavior`, testCase.expected_behavior);
      const tools = String(testCase.tools_triggered ?? "")
        .split(",")
        .map((tool) => tool.trim())
        .filter(Boolean);
      for (const tool of tools) {
        if (!exposedTools.has(tool)) {
          fail(`${label} names ${tool}, which the server does not expose`);
        }
      }
    }
    for (const [index, testCase] of negative.entries()) {
      const label = `negative test case ${index + 1}`;
      checkText(`${label} description`, testCase.description, 4000);
      checkText(`${label} prompt`, testCase.prompt);
    }
  };

  const checkManifest = (manifest) => {
    const name = typeof manifest.name === "string" ? manifest.name : "";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) {
      fail(
        "name must be lowercase letters, numbers and single hyphens, at most 64 characters"
      );
    }
    checkText("version", manifest.version);
    checkText("description", manifest.description, 4000);
    checkText("author.name", manifest.author?.name, 120);
    if (manifest.mcpServers !== "./.mcp.json") {
      fail('mcpServers must be "./.mcp.json"');
    }

    const ui = manifest.interface ?? {};
    checkText("interface.displayName", ui.displayName, 30);
    checkText("interface.shortDescription", ui.shortDescription, 30);
    checkText("interface.longDescription", ui.longDescription, 4000);
    checkText("interface.developerName", ui.developerName, 80);
    checkText("interface.category", ui.category);
    for (const key of [
      "websiteURL",
      "supportURL",
      "privacyPolicyURL",
      "termsOfServiceURL",
    ]) {
      checkHttpsUrl(`interface.${key}`, ui[key]);
    }
    if (!Array.isArray(ui.capabilities) || ui.capabilities.length > 20) {
      fail("interface.capabilities must be an array of at most 20 labels");
    } else {
      for (const label of ui.capabilities) {
        checkText("a capability label", label, 120);
      }
    }
    checkDefaultPrompts(ui.defaultPrompt);
    checkBrandColor(ui, "brandColor", "#ffffff", "white");
    checkBrandColor(ui, "brandColorDark", "#212121", "#212121");
    checkAsset("interface.logo", ui.logo);
    checkAsset("interface.composerIcon", ui.composerIcon);

    const openai = manifest.extensions?.["com.openai"] ?? {};
    if (openai.interface) {
      fail(
        "in the Codex format, interface belongs at the top level, not under extensions"
      );
    }
    checkTestCases(openai.review);
    if (openai.review?.demo_recording_url !== undefined) {
      checkHttpsUrl(
        "review.demo_recording_url",
        openai.review.demo_recording_url
      );
    }
    checkText("publication.release_notes", openai.publication?.release_notes);
  };

  const checkMcpConfig = (config) => {
    const servers = Object.entries(config.mcpServers ?? {});
    if (servers.length !== 1) {
      fail(
        `.mcp.json must declare exactly one server, found ${servers.length}`
      );
    }
    for (const [name, server] of servers) {
      if (server.type !== "streamable-http") {
        fail(`server ${name} must be type "streamable-http"`);
      }
      checkHttpsUrl(`server ${name} url`, server.url);
      if (server.headers && Object.keys(server.headers).length > 0) {
        fail(
          `server ${name} must not send headers: the directory refuses API keys and bearer tokens`
        );
      }
      const auth = server.extensions?.["com.openai"]?.auth;
      if (auth?.type !== "oauth") {
        fail(
          `server ${name} must declare OAuth under extensions["com.openai"].auth`
        );
      }
      if (!["dcr", "cimd", "provided"].includes(auth?.client?.mode)) {
        fail(
          `server ${name} must set auth.client.mode to dcr, cimd or provided`
        );
      }
    }
  };

  const checkSkillHeader = (skillDir, skill) => {
    const path = join(skillDir, "SKILL.md");
    if (!existsSync(path)) {
      fail(`skills/${skill} has no SKILL.md`);
      return;
    }
    const header = readFileSync(path, "utf8").match(/^---\n([\s\S]*?)\n---/);
    if (
      !(
        header &&
        /^name: \S/m.test(header[1]) &&
        /^description: \S/m.test(header[1])
      )
    ) {
      fail(
        `skills/${skill}/SKILL.md needs name and description in its YAML header`
      );
    }
  };

  // Skill icons resolve from the skill folder, as in OpenAI's own plugins.
  const checkSkillIcons = (skillDir, skill) => {
    const agentConfig = join(skillDir, "agents/openai.yaml");
    if (!existsSync(agentConfig)) {
      return;
    }
    const icons = readFileSync(agentConfig, "utf8").matchAll(
      /^\s*(icon_small|icon_large):\s*"?([^"\n]+?)"?\s*$/gm
    );
    for (const [, key, iconPath] of icons) {
      const label = `skills/${skill}/agents/openai.yaml ${key}`;
      if (!iconPath.startsWith("./") || iconPath.split("/").includes("..")) {
        fail(`${label} must be a ./ path inside the skill folder`);
      } else if (!existsSync(join(skillDir, iconPath))) {
        fail(`${label} points to ${iconPath}, which does not exist`);
      }
    }
  };

  const checkSkills = () => {
    const skillsDir = join(pluginRoot, "skills");
    const skills = existsSync(skillsDir)
      ? readdirSync(skillsDir, { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name)
      : [];
    if (skills.length === 0) {
      fail("skills/ has no skill");
    }
    for (const skill of skills) {
      checkSkillHeader(join(skillsDir, skill), skill);
      checkSkillIcons(join(skillsDir, skill), skill);
    }
  };

  const manifest = readJson(".codex-plugin/plugin.json");
  const mcpConfig = readJson(".mcp.json");
  for (const [file, json] of [
    ["plugin.json", manifest],
    [".mcp.json", mcpConfig],
  ]) {
    for (const key of allKeys(json)) {
      if (FORBIDDEN_KEYS.has(key)) {
        fail(`${file} must not contain "${key}"`);
      }
    }
  }
  if (manifest) {
    checkManifest(manifest);
  }
  if (mcpConfig) {
    checkMcpConfig(mcpConfig);
  }
  checkSkills();
  for (const banned of ["hooks", ".app.json"]) {
    if (existsSync(join(pluginRoot, banned))) {
      fail(`${banned} cannot be part of a directory submission`);
    }
  }
  return problems;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const problems = validateCodexPlugin(
    CODEX_PLUGIN_ROOT,
    readExposedToolNames()
  );
  if (problems.length > 0) {
    console.error(`codex-plugin: ${problems.length} problem(s)`);
    for (const problem of problems) {
      console.error(`  - ${problem}`);
    }
    process.exit(1);
  }
  const { version } = JSON.parse(
    readFileSync(join(CODEX_PLUGIN_ROOT, ".codex-plugin/plugin.json"), "utf8")
  );
  console.log(`codex-plugin ${version}: ready for the plugin directory`);
}
