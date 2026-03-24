# @feednest/sdk

TypeScript SDK for [FeedNest](https://feednest.com). Build AI integrations on top of your curated sources, not the whole web. Full types, automatic pagination, and built-in retry.

## Installation

```bash
npm install @feednest/sdk
```

## Quick Start

```typescript
import { FeedNestClient } from "@feednest/sdk";

const client = new FeedNestClient({
  apiKey: "fn_live_YOUR_API_KEY",
});

// Get unread articles
const { data: articles, hasMore } = await client.getNewsfeedArticles({
  unreadOnly: true,
  limit: 10,
});

for (const article of articles) {
  console.log(`${article.title} — ${article.source}`);
}
```

## Prerequisites

- A FeedNest **Pro** subscription ($19.99/mo)
- An API key generated from [Settings → API Keys](https://feednest.com/settings)

## Configuration

```typescript
const client = new FeedNestClient({
  apiKey: "fn_live_...",       // Required
  baseUrl: "https://feednest.com", // Optional (default)
  timeout: 30000,              // Optional, in ms (default: 30s)
});
```

## Methods

### Feeds (read-only)

| Method | Description |
|--------|-------------|
| `getFeeds(opts?)` | List subscribed feeds with unread counts |
| `exportOpml()` | Export all feeds as OPML XML string |

### Articles — Lists

Each method returns `{ data: ArticleV1[], hasMore: boolean }`.

| Method | Description |
|--------|-------------|
| `getNewsfeedArticles(opts?)` | Get articles from the newsfeed |
| `getArticlesByFeed(feedId, opts?)` | Get articles from a specific feed |
| `getArticlesByFolder(folderId, opts?)` | Get articles from a folder |
| `getArticlesByTag(tagId, opts?)` | Get articles with a specific tag |
| `getArticlesWithTags(opts?)` | Get all tagged articles |
| `getArticlesWithHighlights(opts?)` | Get articles with highlights |
| `getArticlesWithNotes(opts?)` | Get articles with notes |
| `getRecentlyRead(opts?)` | Get recently read articles |

**Common options:** `limit`, `beforePublishedAt`, `beforeId`, `unreadOnly`, `query`, `dateFrom`, `dateTo`, `sort`

**Pagination:** Keyset-based. Pass the last article's `published_at` and `id` as `beforePublishedAt` and `beforeId` for the next page.

### Articles — Single

| Method | Description |
|--------|-------------|
| `getArticle(id)` | Get full article details with content, highlights, and notes |
| `extractArticle(id)` | Load full content from the original URL |

### Articles — Actions

| Method | Description |
|--------|-------------|
| `markAsRead(id)` | Mark an article as read |
| `markAsUnread(id)` | Mark an article as unread |
| `markAllAsRead(opts?)` | Mark all as read (optionally by feed/folder) |

### Saving

| Method | Description |
|--------|-------------|
| `saveArticle(id)` | Save an article for later |
| `unsaveArticle(id)` | Remove from saved |
| `saveUrl(url)` | Save an external URL |
| `getSavedArticles(opts?)` | List saved articles |

### Highlights

| Method | Description |
|--------|-------------|
| `getHighlights(articleId)` | Get all highlights from an article |
| `addHighlight(articleId, text, color?)` | Highlight a text passage |
| `removeHighlight(articleId, highlightId)` | Remove a highlight |

### Notes

| Method | Description |
|--------|-------------|
| `getNotes(articleId)` | Get the note on an article |
| `addNote(articleId, content)` | Add or update a note |
| `deleteNote(articleId)` | Delete a note |

### Tags

| Method | Description |
|--------|-------------|
| `getTags()` | List all user tags |
| `createTag(name, color?)` | Create a new tag |
| `tagArticle(articleId, tagId)` | Add a tag to an article |
| `untagArticle(articleId, tagId)` | Remove a tag from an article |

### Folders (read-only)

| Method | Description |
|--------|-------------|
| `getFolders()` | List all feed folders |

### Output Feeds (read-only)

| Method | Description |
|--------|-------------|
| `getOutputFeeds()` | List public RSS feeds created by the user |

### AI

| Method | Description |
|--------|-------------|
| `textToSpeech(articleId)` | Generate audio from an article |

### Stats

| Method | Description |
|--------|-------------|
| `getStats()` | Get reading statistics (streak, time, goals) |

## Error Handling

All errors are thrown as `FeedNestError` with a machine-readable `code`:

```typescript
import { FeedNestClient, FeedNestError } from "@feednest/sdk";

try {
  await client.getNewsfeedArticles();
} catch (error) {
  if (error instanceof FeedNestError) {
    switch (error.code) {
      case "UNAUTHORIZED":
        // Invalid or missing API key
        break;
      case "SUBSCRIPTION_REQUIRED":
        // Pro subscription needed
        break;
      case "RATE_LIMITED":
        // Too many requests — wait error.retryAfter seconds
        break;
      case "FORBIDDEN":
        // Insufficient API key scope
        break;
      case "NOT_FOUND":
        // Resource doesn't exist
        break;
      case "TIMEOUT":
        // Request exceeded timeout
        break;
      case "NETWORK_ERROR":
        // Connection failed
        break;
    }
  }
}
```

## Types

All types are exported for TypeScript consumers:

```typescript
import type {
  ArticleV1,
  ArticleDetailV1,
  FeedV1,
  FolderV1,
  TagV1,
  HighlightV1,
  NoteV1,
  SavedArticleV1,
  OutputFeedV1,
  StatsV1,
  TextToSpeechV1,
  RecentlyReadV1,
  PaginatedResponse,
} from "@feednest/sdk";
```

## License

MIT
