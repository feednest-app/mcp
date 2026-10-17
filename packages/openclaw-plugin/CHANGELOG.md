# Changelog

## 0.1.3

### Fixed

- OpenClaw loads the plugin's skill. SKILL.md had no frontmatter, and
  OpenClaw skips a skill without a `description`, so since 0.1.0 agents never
  saw its guidance: how to read a truncated article, when to confirm, how to
  build a daily recap. It now starts with `name` and `description`, and a test
  checks every skill the manifest lists.

### Changed

- Bundles `@feednest/shared-tool-defs@0.1.4`:
  - `feednest_get_article` and `feednest_extract_article` say when an article
    is only the publisher's free preview of a paid article: the full article is
    on the publisher's site, for subscribers, and extracting it again gives the
    same preview.
  - Tool descriptions only describe the tool (shared-tool-defs 0.1.3).
    `feednest_mark_all_as_read` no longer tells the agent to ask for
    confirmation, and `feednest_get_article` and `feednest_extract_article` no
    longer point at each other: that guidance is in SKILL.md.
- SKILL.md: reading an article now says not to extract a publisher's free
  preview again.
- README: the upgrade link points at the pricing section of feednest.com.
- `openclaw.plugin.json` and `clawhub.json` carry the package version.

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
