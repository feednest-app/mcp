# Changelog

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
