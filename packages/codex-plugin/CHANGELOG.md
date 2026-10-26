# Changelog

## Unreleased

### Changed

- The skill opens without naming other assistants, and its description says
  when to use it. The Claude plugin in `packages/claude-plugin` uses the same
  file, word for word.

## 0.2.0

### Changed

- The plugin signs in with OAuth instead of an API key. `.mcp.json` declares
  the server as `streamable-http` with OAuth dynamic client registration, so
  every FeedNest plan can connect and no `FEEDNEST_API_KEY` is read. Codex
  opens the sign-in itself, or through `codex mcp login feednest`.
- The manifest is ready for the plugin directory shared by ChatGPT and Codex:
  a 30-character short description, the listing text used in the Claude
  connectors directory, a support URL, the developer named as on
  feednest.com's legal pages, three starter prompts instead of four (the
  directory keeps at most three), and the review section with five positive
  and three negative test cases plus release notes.
- Brand colors follow the app: `#945400` on light surfaces, where the
  directory asks for 2:1 contrast against white and `#ffbf69` only reaches
  1.6:1, and `#ffbf69` as `brandColorDark`. The composer icon is the SVG logo.
- The skill's `agents/openai.yaml` keeps only its name, description and
  starter prompt. Its icons pointed outside the skill folder, and the MCP
  server it declared is the one `.mcp.json` already provides.
- The skill and the README describe what each plan allows instead of
  requiring Pro and an API key, and no longer use em dashes.

### Added

- `scripts/validate-codex-plugin.mjs` checks the package against the
  directory's limits on every `npm test`, with tests of its own, and
  `npm run pack:codex-plugin` writes the ZIP to upload to
  `dist/feednest-plugin-<version>.zip`.

## 0.1.2

### Changed

- The manifest description, short description, and keywords, the skill, and
  the MCP dependency description no longer mention audio. 0.1.1 removed the
  tool but left these claims behind.
- The README no longer sends users to the Codex plugin directory, where
  FeedNest is not listed yet. Local installation is the way in until it is.

## 0.1.1

### Changed

- The hosted MCP server no longer exposes `text_to_speech`: it generates audio
  with an AI model, which the Claude connectors directory does not allow. The
  plugin now describes 25 tools and the skill no longer routes "read this
  aloud" to a tool the server does not offer. Reading articles aloud stays in
  the FeedNest app and in the OpenClaw plugin.

## 0.1.0

Initial release.

- Codex plugin with `.codex-plugin/plugin.json` manifest
- 26 MCP tools via remote FeedNest server at `mcp.feednest.com`
- Read articles from websites, podcasts, YouTube, and Google News
- Manage highlights, notes, tags, save links, generate audio
- SKILL.md with tool guidance for AI agents
- `agents/openai.yaml` with UI metadata, implicit invocation, and MCP tool dependency
- Brand assets (logo)
