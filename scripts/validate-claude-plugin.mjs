#!/usr/bin/env node
/**
 * Check packages/claude-plugin, the plugin for Claude Code and Cowork, for
 * the mistakes `claude plugin validate --strict` cannot see, because they
 * are about FeedNest rather than the plugin format:
 *
 * - the skill is the Codex plugin's skill, word for word, so the two
 *   assistants get the same instructions from one text;
 * - the MCP config points at the server of FeedNest's listing in Claude's
 *   connectors directory, character for character (the directory pairs a
 *   plugin with a connector only on the same URL), which is also the server
 *   in server.json, over HTTP, with no headers: people sign in with OAuth
 *   and never paste a key;
 * - every tool a command or the skill names is one the hosted server
 *   exposes;
 * - the repository's marketplace lists the plugin under its own name and
 *   folder;
 * - every command has a description, which is what the `/` menu shows.
 *
 * Run `claude plugin validate --strict` on the plugin and on the repository
 * root for the format itself.
 *
 * Usage: node scripts/validate-claude-plugin.mjs   (exit code 1 on any problem)
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readExposedToolNames } from "./validate-codex-plugin.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** The plugin folder the marketplace installs. */
export const CLAUDE_PLUGIN_ROOT = join(repoRoot, "packages/claude-plugin");

/** The skill both plugins share. */
const SHARED_SKILL = join(
  repoRoot,
  "packages/codex-plugin/skills/feednest/SKILL.md"
);

/**
 * The server URL of FeedNest's listing in Claude's connectors directory,
 * exactly as the listing has it: the directory pairs a plugin with a
 * connector only when the two URLs are the same.
 */
export const DIRECTORY_CONNECTOR_URL = "https://mcp.feednest.com/";

/** Tool names in backticks, e.g. `get_articles`. */
const TOOL_MENTION = /`([a-z]+(?:_[a-z]+)+)`/g;

/**
 * Words in backticks that look like tool names but are parameters or
 * fields of the tools' answers.
 */
const NOT_TOOLS = new Set([
  "article_id",
  "before_id",
  "before_published_at",
  "count_only",
  "date_from",
  "date_to",
  "feed_id",
  "folder_id",
  "summary_preview",
  "tag_id",
  "unread_only",
]);

/**
 * Validate the Claude plugin against the FeedNest-specific rules above.
 *
 * @param {object} paths - Where to look.
 * @param {string} paths.pluginRoot - Folder holding `.claude-plugin/plugin.json`.
 * @param {string} paths.marketplacePath - The repository's marketplace.json.
 * @param {string} paths.serverJsonPath - The MCP Registry entry, server.json.
 * @param {string} paths.sharedSkillPath - The Codex plugin's SKILL.md.
 * @param {Set<string>} exposedTools - Tools the hosted server exposes.
 * @returns {string[]} One message per problem; empty when the plugin is ready.
 */
export function validateClaudePlugin(paths, exposedTools) {
  const problems = [];
  const fail = (message) => problems.push(message);

  const manifest = readJson(
    join(paths.pluginRoot, ".claude-plugin/plugin.json"),
    ".claude-plugin/plugin.json",
    fail
  );
  const mcpConfig = readJson(
    join(paths.pluginRoot, ".mcp.json"),
    ".mcp.json",
    fail
  );
  const serverJson = readJson(paths.serverJsonPath, "server.json", fail);
  const marketplace = readJson(paths.marketplacePath, "marketplace.json", fail);

  if (mcpConfig) {
    checkMcpServer(mcpConfig, serverJson?.remotes?.[0]?.url, fail);
  }
  const texts = [
    ...checkSharedSkill(paths, fail),
    ...checkCommands(paths.pluginRoot, fail),
  ];
  checkToolNames(texts, exposedTools, fail);
  if (manifest && marketplace) {
    checkMarketplace(manifest, marketplace, paths, fail);
  }
  return problems;
}

/** Parse a JSON file, or report it missing or broken and return null. */
function readJson(path, label, fail) {
  if (!existsSync(path)) {
    fail(`${label} is missing`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`);
    return null;
  }
}

/** A URL without its trailing slashes, to compare server.json's remote. */
const withoutTrailingSlash = (url) => url.replace(/\/+$/, "");

/** One server, the directory listing's, over HTTP, OAuth only. */
function checkMcpServer(mcpConfig, remoteUrl, fail) {
  const servers = Object.entries(mcpConfig.mcpServers ?? {});
  if (servers.length !== 1) {
    fail(".mcp.json must declare exactly one server");
  }
  for (const [name, server] of servers) {
    if (server.type !== "http") {
      fail(`.mcp.json server "${name}" must have type "http"`);
    }
    if (server.url !== DIRECTORY_CONNECTOR_URL) {
      fail(
        `.mcp.json server "${name}" points at ${server.url}, the directory listing at ${DIRECTORY_CONNECTOR_URL}`
      );
    }
    if (
      remoteUrl &&
      withoutTrailingSlash(remoteUrl) !==
        withoutTrailingSlash(DIRECTORY_CONNECTOR_URL)
    ) {
      fail(
        `server.json's remote ${remoteUrl} is not the directory listing's ${DIRECTORY_CONNECTOR_URL}`
      );
    }
    if (server.headers) {
      fail(`.mcp.json server "${name}" must not send headers: OAuth only`);
    }
  }
}

/**
 * The skill is the Codex plugin's, word for word.
 *
 * @returns {Array<[string, string]>} The skill's label and text, to check
 *          the tools it names.
 */
function checkSharedSkill(paths, fail) {
  const skillPath = join(paths.pluginRoot, "skills/feednest/SKILL.md");
  if (!existsSync(skillPath)) {
    fail("skills/feednest/SKILL.md is missing");
    return [];
  }
  const text = readFileSync(skillPath, "utf8");
  if (
    existsSync(paths.sharedSkillPath) &&
    text !== readFileSync(paths.sharedSkillPath, "utf8")
  ) {
    fail(
      "skills/feednest/SKILL.md differs from the Codex plugin's: copy it from packages/codex-plugin"
    );
  }
  return [["skills/feednest/SKILL.md", text]];
}

/**
 * Every command has a description in its YAML header.
 *
 * @returns {Array<[string, string]>} Each command's label and text.
 */
function checkCommands(pluginRoot, fail) {
  const commandsDir = join(pluginRoot, "commands");
  const files = existsSync(commandsDir)
    ? readdirSync(commandsDir).filter((file) => file.endsWith(".md"))
    : [];
  if (files.length === 0) {
    fail("commands/ has no command");
  }
  return files.map((file) => {
    const text = readFileSync(join(commandsDir, file), "utf8");
    const header = text.match(/^---\n([\s\S]*?)\n---/);
    if (!(header && /^description: \S/m.test(header[1]))) {
      fail(`commands/${file} needs a description in its YAML header`);
    }
    return [`commands/${file}`, text];
  });
}

/** Tool names in backticks must be tools the server exposes. */
function checkToolNames(texts, exposedTools, fail) {
  for (const [label, text] of texts) {
    for (const [, name] of text.matchAll(TOOL_MENTION)) {
      if (!(NOT_TOOLS.has(name) || exposedTools.has(name))) {
        fail(`${label} names \`${name}\`, which the server does not expose`);
      }
    }
  }
}

/** The marketplace installs the plugin under its own name, from its folder. */
function checkMarketplace(manifest, marketplace, paths, fail) {
  const entry = (marketplace.plugins ?? []).find(
    (plugin) => plugin.name === manifest.name
  );
  const folder = `./${relativeToRepo(paths.marketplacePath, paths.pluginRoot)}`;
  if (!entry) {
    fail(`marketplace.json does not list the plugin "${manifest.name}"`);
  } else if (entry.source !== folder) {
    fail(
      `marketplace.json installs "${manifest.name}" from ${entry.source}, the plugin is at ${folder}`
    );
  }
}

/**
 * The plugin folder relative to the repository that holds the marketplace
 * (`<repo>/.claude-plugin/marketplace.json`), with forward slashes.
 */
function relativeToRepo(marketplacePath, pluginRoot) {
  const repo = dirname(dirname(marketplacePath));
  return pluginRoot
    .slice(repo.length + 1)
    .split("\\")
    .join("/");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const problems = validateClaudePlugin(
    {
      marketplacePath: join(repoRoot, ".claude-plugin/marketplace.json"),
      pluginRoot: CLAUDE_PLUGIN_ROOT,
      serverJsonPath: join(repoRoot, "server.json"),
      sharedSkillPath: SHARED_SKILL,
    },
    readExposedToolNames()
  );
  if (problems.length > 0) {
    console.error(`claude-plugin: ${problems.length} problem(s)`);
    for (const problem of problems) {
      console.error(`  - ${problem}`);
    }
    process.exit(1);
  }
  const { version } = JSON.parse(
    readFileSync(join(CLAUDE_PLUGIN_ROOT, ".claude-plugin/plugin.json"), "utf8")
  );
  console.log(`claude-plugin ${version}: ready`);
}
