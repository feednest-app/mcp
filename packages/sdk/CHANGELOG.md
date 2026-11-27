# Changelog

## 0.1.3

### Fixed

- Requests go to `https://www.feednest.com` by default instead of
  `https://feednest.com`. The bare domain answers with a redirect to www, and
  `fetch` drops the `Authorization` header on a redirect to another host, so a
  call made with the default base URL reached the API without its key and
  failed with 401 `UNAUTHORIZED` ("Bearer token required").
- A `baseUrl` of `https://feednest.com`, `http://feednest.com` or
  `http://www.feednest.com` is sent to `https://www.feednest.com` too, so a
  configuration copied from the earlier README keeps working, and the key is
  never sent over plain HTTP. Any other `baseUrl` is used as given.

## 0.1.2

### Changed

- The package description and the README describe FeedNest with its slogan,
  "the news reader your AI can read", instead of "your curated sources".

## 0.1.1

### Fixed

- Updated package description and README to align with brand positioning
- Removed broken repository link from package metadata
- Added homepage link to integrations page

## 0.1.0

### Added

- `FeedNestClient` with typed methods for all API v1 endpoints
- `FeedNestError` with machine-readable error codes
- Full TypeScript type exports for all V1 response types
- Keyset pagination support on all list endpoints
- Timeout and abort controller support
- CJS + ESM dual package output
