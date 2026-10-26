# Changelog

## 0.2.0

### Added

- `/feednest:research <topic>`: searches the user's sources for a topic,
  reads the three to five most relevant articles (the full text on Plus and
  Pro) and writes findings, agreements and differences, citing every source.
- `/feednest:compare [story]`: how different sources covered the same story,
  with the facts all of them report, what only some report, angle and tone,
  and claims that disagree. Without a story it picks the most covered one.
- `/feednest:weekly-review [folder or topic]`: the week's reading, the
  themes that came up and unread articles worth the time; on Plus and Pro
  also highlights, notes, streak and reading time.

Research and compare stay under ten tool calls and the weekly review takes
about five, within the Free plan's 20 an hour; each says plainly when the
plan leaves something out.

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
