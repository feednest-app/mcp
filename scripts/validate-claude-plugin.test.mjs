/**
 * Tests for scripts/validate-claude-plugin.mjs: the real plugin passes, and
 * each FeedNest-specific mistake is caught on a copy.
 *
 * Run with: node --test scripts/validate-claude-plugin.test.mjs
 */

import assert from "node:assert/strict";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  CLAUDE_PLUGIN_ROOT,
  validateClaudePlugin,
} from "./validate-claude-plugin.mjs";
import { readExposedToolNames } from "./validate-codex-plugin.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tools = readExposedToolNames();
const scratch = mkdtempSync(join(tmpdir(), "claude-plugin-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

let copies = 0;

/**
 * Copy the plugin, the marketplace, server.json and the shared skill into a
 * repository-shaped folder, let `breakIt` damage it, return the problems.
 */
function problemsAfter(breakIt) {
  copies += 1;
  const repo = join(scratch, `repo-${copies}`);
  const pluginRoot = join(repo, "packages/claude-plugin");
  cpSync(CLAUDE_PLUGIN_ROOT, pluginRoot, { recursive: true });
  mkdirSync(join(repo, ".claude-plugin"), { recursive: true });
  cpSync(
    join(repoRoot, ".claude-plugin/marketplace.json"),
    join(repo, ".claude-plugin/marketplace.json")
  );
  cpSync(join(repoRoot, "server.json"), join(repo, "server.json"));
  const sharedSkillPath = join(repo, "codex-SKILL.md");
  cpSync(
    join(repoRoot, "packages/codex-plugin/skills/feednest/SKILL.md"),
    sharedSkillPath
  );
  const paths = {
    marketplacePath: join(repo, ".claude-plugin/marketplace.json"),
    pluginRoot,
    serverJsonPath: join(repo, "server.json"),
    sharedSkillPath,
  };
  breakIt(paths);
  return validateClaudePlugin(paths, tools);
}

/** Read, change and write back a JSON file. */
function editJson(path, change) {
  const json = JSON.parse(readFileSync(path, "utf8"));
  change(json);
  writeFileSync(path, JSON.stringify(json, null, 2));
}

const mcpPath = (paths) => join(paths.pluginRoot, ".mcp.json");
const briefingPath = (paths) => join(paths.pluginRoot, "commands/briefing.md");

test("the real plugin is ready", () => {
  assert.deepEqual(
    problemsAfter(() => undefined),
    []
  );
});

test("a skill that drifted from the Codex plugin's is caught", () => {
  const problems = problemsAfter((paths) => {
    const skill = join(paths.pluginRoot, "skills/feednest/SKILL.md");
    writeFileSync(skill, `${readFileSync(skill, "utf8")}\nOne more line.\n`);
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /differs from the Codex plugin's/);
});

test("an MCP server other than the directory listing's is caught", () => {
  const problems = problemsAfter((paths) =>
    editJson(mcpPath(paths), (json) => {
      json.mcpServers.feednest.url = "https://staging.feednest.com/";
    })
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /points at https:\/\/staging\.feednest\.com\//);
});

test("the listing's URL without its trailing slash is caught: pairing needs the same string", () => {
  const problems = problemsAfter((paths) =>
    editJson(mcpPath(paths), (json) => {
      json.mcpServers.feednest.url = "https://mcp.feednest.com";
    })
  );
  assert.deepEqual(problems, [
    '.mcp.json server "feednest" points at https://mcp.feednest.com, the directory listing at https://mcp.feednest.com/',
  ]);
});

test("a server.json remote that moved away from the listing is caught", () => {
  const problems = problemsAfter((paths) =>
    editJson(paths.serverJsonPath, (json) => {
      json.remotes[0].url = "https://api.feednest.com/mcp";
    })
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /server\.json's remote/);
});

test("a key in the headers is refused: people sign in with OAuth", () => {
  const problems = problemsAfter((paths) =>
    editJson(mcpPath(paths), (json) => {
      json.mcpServers.feednest.headers = {
        Authorization: "Bearer fn_live_example",
      };
    })
  );
  assert.deepEqual(problems, [
    '.mcp.json server "feednest" must not send headers: OAuth only',
  ]);
});

test("a transport other than HTTP is caught", () => {
  const problems = problemsAfter((paths) =>
    editJson(mcpPath(paths), (json) => {
      json.mcpServers.feednest.type = "sse";
    })
  );
  assert.deepEqual(problems, [
    '.mcp.json server "feednest" must have type "http"',
  ]);
});

test("a command naming a tool the server does not expose is caught", () => {
  const problems = problemsAfter((paths) => {
    const path = briefingPath(paths);
    writeFileSync(
      path,
      readFileSync(path, "utf8").replace("`get_folders`", "`list_folders`")
    );
  });
  assert.deepEqual(problems, [
    "commands/briefing.md names `list_folders`, which the server does not expose",
  ]);
});

test("a command without a description is caught", () => {
  const problems = problemsAfter((paths) => {
    const path = briefingPath(paths);
    writeFileSync(
      path,
      readFileSync(path, "utf8").replace(/^description: .*\n/m, "")
    );
  });
  assert.deepEqual(problems, [
    "commands/briefing.md needs a description in its YAML header",
  ]);
});

test("a marketplace that does not install this folder is caught", () => {
  const problems = problemsAfter((paths) =>
    editJson(paths.marketplacePath, (json) => {
      json.plugins[0].source = "./packages/codex-plugin";
    })
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /the plugin is at \.\/packages\/claude-plugin/);
});

test("a marketplace that lists another name is caught", () => {
  const problems = problemsAfter((paths) =>
    editJson(paths.marketplacePath, (json) => {
      json.plugins[0].name = "feednest-news";
    })
  );
  assert.deepEqual(problems, [
    'marketplace.json does not list the plugin "feednest"',
  ]);
});
