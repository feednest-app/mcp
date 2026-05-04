# Changelog

## 0.1.1

### Fixed

- `formatArticleList` now exposes the ISO `published_at` for every article so MCP clients can build the keyset pagination cursor (`before_id` + `before_published_at`). Without this the API returned 0 rows on the second page of large folders or feeds because the underlying RPC requires both cursor values.

## 0.1.0

Initial release.

- Shared Zod schemas for the 26 FeedNest MCP tools
- Human-readable text formatters for V1 API responses
- JSON Schema generation helper for tool consumers
