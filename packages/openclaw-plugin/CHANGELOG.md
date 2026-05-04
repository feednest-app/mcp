# Changelog

## 0.1.2

### Fixed

- `formatArticleList` (via the bundled `@feednest/shared-tool-defs@0.1.1`) now exposes ISO `published_at` per article. Lets agents paginate reliably through large folders and feeds using the keyset cursor.

## 0.1.1

### Fixed

- Updated package description, README, and SKILL.md to align with brand positioning
- Updated openclaw.plugin.json description
- Fixed openclaw.extensions path to point to built output
- Removed broken repository link from package metadata
- Added homepage link to integrations page

## 0.1.0

Initial release.

- 26 agent tools mapped 1:1 to FeedNest MCP/API tools
- Read articles from websites, podcasts, YouTube, and Google News
- Manage highlights, notes, tags, save links, generate audio
- SKILL.md with tool guidance for AI agents
- Read-only tools enabled by default; write/AI tools are optional
