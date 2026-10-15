/**
 * Tests for scripts/validate-codex-plugin.mjs: the real package passes, and
 * each kind of mistake the plugin directory rejects is caught on a copy.
 *
 * Run with: node --test scripts/validate-codex-plugin.test.mjs
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
import { join } from "node:path";
import { after, test } from "node:test";
import {
  CODEX_PLUGIN_ROOT,
  contrastRatio,
  readExposedToolNames,
  validateCodexPlugin,
} from "./validate-codex-plugin.mjs";

const tools = readExposedToolNames();
const scratch = mkdtempSync(join(tmpdir(), "codex-plugin-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

let copies = 0;

/** Copy the real package, let `breakIt` damage the copy, return the problems. */
function problemsAfter(breakIt) {
  copies += 1;
  const root = join(scratch, `copy-${copies}`);
  cpSync(CODEX_PLUGIN_ROOT, root, { recursive: true });
  breakIt(root);
  return validateCodexPlugin(root, tools);
}

/** Read, change and write back a JSON file of a copy. */
function editJson(root, relativePath, change) {
  const path = join(root, relativePath);
  const json = JSON.parse(readFileSync(path, "utf8"));
  change(json);
  writeFileSync(path, JSON.stringify(json, null, 2));
}

const editManifest = (root, change) =>
  editJson(root, ".codex-plugin/plugin.json", change);
const testCases = (manifest) =>
  manifest.extensions["com.openai"].review.test_cases;

/** A PNG header with the given size: enough for the validator, which reads IHDR. */
function pngHeader(width, height) {
  const buffer = Buffer.alloc(33);
  Buffer.from("89504e470d0a1a0a", "hex").copy(buffer, 0);
  buffer.writeUInt32BE(13, 8);
  buffer.write("IHDR", 12, "ascii");
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

test("the package in the repository is ready", () => {
  assert.deepEqual(validateCodexPlugin(CODEX_PLUGIN_ROOT, tools), []);
});

test("text_to_speech is not offered by the hosted server", () => {
  assert.equal(tools.has("text_to_speech"), false);
  assert.equal(tools.has("get_articles"), true);
});

test("a short description over 30 characters", () => {
  const problems = problemsAfter((root) =>
    editManifest(root, (manifest) => {
      manifest.interface.shortDescription = "Search and annotate your feedss";
    })
  );
  assert.deepEqual(problems, [
    "interface.shortDescription is 31 characters, the limit is 30",
  ]);
});

test("an MCP config that sends an API key", () => {
  const problems = problemsAfter((root) =>
    editJson(root, ".mcp.json", (config) => {
      config.mcpServers.feednest.headers = {
        Authorization: "Bearer example-key",
      };
    })
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /must not send headers/);
});

test("an MCP config without OAuth", () => {
  const problems = problemsAfter((root) =>
    editJson(root, ".mcp.json", (config) => {
      config.mcpServers.feednest.extensions = undefined;
    })
  );
  assert.equal(problems.length, 2);
  assert.match(problems[0], /must declare OAuth/);
});

test("four positive test cases instead of five", () => {
  const problems = problemsAfter((root) =>
    editManifest(root, (manifest) => {
      testCases(manifest).positive.pop();
    })
  );
  assert.deepEqual(problems, [
    "review needs exactly 5 positive test cases, found 4",
  ]);
});

test("a test case naming a tool the server withholds or does not have", () => {
  const problems = problemsAfter((root) =>
    editManifest(root, (manifest) => {
      testCases(manifest).positive[0].tools_triggered =
        "get_articles, text_to_speech, subscribe";
    })
  );
  assert.deepEqual(problems, [
    "positive test case 1 names text_to_speech, which the server does not expose",
    "positive test case 1 names subscribe, which the server does not expose",
  ]);
});

test("a positive test case without expected behavior", () => {
  const problems = problemsAfter((root) =>
    editManifest(root, (manifest) => {
      testCases(manifest).positive[2].expected_behavior = undefined;
    })
  );
  assert.deepEqual(problems, [
    "positive test case 3 expected_behavior is required",
  ]);
});

test("reviewer credentials inside the package", () => {
  const problems = problemsAfter((root) =>
    editManifest(root, (manifest) => {
      manifest.extensions["com.openai"].review.test_credentials = {
        username: "x",
      };
    })
  );
  assert.deepEqual(problems, [
    'plugin.json must not contain "test_credentials"',
  ]);
});

test("a listing URL over plain http", () => {
  const problems = problemsAfter((root) =>
    editManifest(root, (manifest) => {
      manifest.interface.privacyPolicyURL = "http://www.feednest.com/privacy";
    })
  );
  assert.deepEqual(problems, ["interface.privacyPolicyURL must use https"]);
});

test("a logo that is not square", () => {
  const problems = problemsAfter((root) => {
    mkdirSync(join(root, "assets"), { recursive: true });
    writeFileSync(join(root, "assets/wide.png"), pngHeader(200, 100));
    editManifest(root, (manifest) => {
      manifest.interface.logo = "./assets/wide.png";
    });
  });
  assert.deepEqual(problems, ["interface.logo must be square, it is 200x100"]);
});

test("a hooks folder", () => {
  const problems = problemsAfter((root) => mkdirSync(join(root, "hooks")));
  assert.deepEqual(problems, [
    "hooks cannot be part of a directory submission",
  ]);
});

test("a skill without its YAML header", () => {
  const problems = problemsAfter((root) =>
    writeFileSync(join(root, "skills/feednest/SKILL.md"), "# FeedNest\n")
  );
  assert.deepEqual(problems, [
    "skills/feednest/SKILL.md needs name and description in its YAML header",
  ]);
});

test("more than three starter prompts", () => {
  const problems = problemsAfter((root) =>
    editManifest(root, (manifest) => {
      manifest.interface.defaultPrompt.push(
        "Highlight the key findings in this article"
      );
    })
  );
  assert.deepEqual(problems, [
    "interface.defaultPrompt has 4 prompts, the limit is 3",
  ]);
});

test("a starter prompt that mentions an app", () => {
  const problems = problemsAfter((root) =>
    editManifest(root, (manifest) => {
      manifest.interface.defaultPrompt[0] = "@FeedNest what's new?";
    })
  );
  assert.deepEqual(problems, [
    'default prompt "@FeedNest what\'s new?" must not @mention an app',
  ]);
});

test("contrast ratios match WCAG", () => {
  assert.equal(contrastRatio("#000000", "#ffffff").toFixed(0), "21");
  // The app's note in globals.css rounds these down to 1.6:1 and 5.9:1.
  assert.equal(contrastRatio("#ffbf69", "#ffffff").toFixed(2), "1.63");
  assert.equal(contrastRatio("#945400", "#ffffff").toFixed(2), "5.95");
  assert.ok(contrastRatio("#ffbf69", "#212121") > 9);
});

test("the light brand color too pale for white", () => {
  const problems = problemsAfter((root) =>
    editManifest(root, (manifest) => {
      manifest.interface.brandColor = "#ffbf69";
    })
  );
  assert.deepEqual(problems, [
    "interface.brandColor #ffbf69 has 1.63:1 contrast against white, the minimum is 2:1",
  ]);
});

test("the dark brand color too dark for the dark theme", () => {
  const problems = problemsAfter((root) =>
    editManifest(root, (manifest) => {
      manifest.interface.brandColorDark = "#333333";
    })
  );
  assert.equal(problems.length, 1);
  assert.match(
    problems[0],
    /^interface\.brandColorDark #333333 has 1\.\d\d:1 contrast against #212121/
  );
});

test("an SVG icon that is not square", () => {
  const problems = problemsAfter((root) => {
    writeFileSync(
      join(root, "assets/logo.svg"),
      '<svg width="100" height="50" viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg"></svg>'
    );
  });
  assert.deepEqual(problems, [
    "interface.composerIcon needs square numeric dimensions or a square viewBox of at least 48 by 48",
  ]);
});

test("an icon path that leaves the plugin", () => {
  const problems = problemsAfter((root) =>
    editManifest(root, (manifest) => {
      manifest.interface.logo = "./assets/../../logo.png";
    })
  );
  assert.deepEqual(problems, [
    "interface.logo must be a ./ path inside the plugin",
  ]);
});

test("a skill icon outside the skill folder", () => {
  const problems = problemsAfter((root) => {
    const config = join(root, "skills/feednest/agents/openai.yaml");
    writeFileSync(
      config,
      `${readFileSync(config, "utf8")}  icon_small: "../../assets/logo.svg"\n`
    );
  });
  assert.deepEqual(problems, [
    "skills/feednest/agents/openai.yaml icon_small must be a ./ path inside the skill folder",
  ]);
});

test("a demo recording link over plain http", () => {
  const problems = problemsAfter((root) =>
    editManifest(root, (manifest) => {
      manifest.extensions["com.openai"].review.demo_recording_url =
        "http://example.com/demo.mp4";
    })
  );
  assert.deepEqual(problems, ["review.demo_recording_url must use https"]);
});
