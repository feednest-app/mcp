# Changelog

## 0.1.0

### Added

- The plugin for Claude Code and Cowork: the FeedNest MCP server at
  `https://mcp.feednest.com` over HTTP with OAuth (no API key), the
  `feednest` skill and the `/feednest:briefing` command, a briefing of the
  unread articles in the user's feeds grouped by topic in one or two tool
  calls.
- The repository's `.claude-plugin/marketplace.json`, so the plugin installs
  with `/plugin marketplace add feednest-app/mcp`.
- `scripts/validate-claude-plugin.mjs`, run by `npm test` with tests of its
  own: the skill is the Codex plugin's word for word, the server is the one
  in `server.json` with no headers, commands and the skill name only tools
  the server exposes, and the marketplace installs this folder.
