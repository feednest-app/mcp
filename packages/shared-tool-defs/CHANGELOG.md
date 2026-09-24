# Changelog

## 0.1.3

### Changed

- Tool descriptions are purely descriptive. `get_article` and
  `extract_article` no longer point at each other, `mark_all_as_read` no
  longer tells the model to ask for confirmation, and `get_articles` /
  `get_feeds` describe their parameters instead of coaching their use. The
  Claude connectors directory requires descriptions with no instructions about
  model behavior or other tools; cross-tool workflow lives in the MCP server's
  `instructions`. A test now pins this for every tool.
- `mark_all_as_read` is annotated destructive. It rewrites the read state of
  every matching article with no bulk undo, so clients should confirm before
  running it.

## 0.1.2

### Fixed

- `extract_article` and `save_url` now declare `openWorldHint: true`. Both fetch
  a URL the caller chooses (the publisher's page and an arbitrary address), so
  the previous closed-world hint misdescribed them. Every other tool stays
  closed-world and a test now pins both directions.

## 0.1.1

### Fixed

- `formatArticleList` now exposes the ISO `published_at` for every article so MCP clients can build the keyset pagination cursor (`before_id` + `before_published_at`). Without this the API returned 0 rows on the second page of large folders or feeds because the underlying RPC requires both cursor values.

## 0.1.0

Initial release.

- Shared Zod schemas for the 26 FeedNest MCP tools
- Human-readable text formatters for V1 API responses
- JSON Schema generation helper for tool consumers
