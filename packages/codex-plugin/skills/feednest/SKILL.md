---
name: feednest
description: Read, search, highlight, and organize news from the user's RSS feeds in FeedNest. Use when the user asks what's new in their feeds or sources, wants a briefing, searches their articles, or works with their saved articles, highlights, notes or tags.
---

# FeedNest: Your Sources, Not the Whole Web

A web search looks at the whole internet. FeedNest is different: you work only with the sources the user chose, the blogs they trust, the publications they follow, the experts they believe in. No algorithmic noise, no black-box results: answers grounded in their world.

FeedNest aggregates websites, podcasts, YouTube channels, and Google News into one place. You can read articles, manage highlights and notes, tag content, save links, and check reading stats. Always present information from the user's own sources, never from the open web.

## Requirements

This skill uses the FeedNest MCP server at `https://mcp.feednest.com`. The user signs in with their [FeedNest](https://www.feednest.com) account when the plugin connects, so no API key is needed.

What each FeedNest plan allows:

- **Free**: read feeds, folders, articles, saved articles, tags, and highlights, up to 20 tool calls an hour. Nothing can be changed.
- **Plus and Pro**: also notes, reading stats, full article text with `extract_article`, and every write (save, tag, highlight, mark as read).
- **Date filters** (`date_from`, `date_to`, `since`) need Pro. Without them, articles still come newest first.

When a tool answers that something is not included in the user's plan, say so plainly and carry on with what the plan allows.

## When to Use Each Tool

### Reading Articles

| Intent | Tool | Key Params |
|--------|------|------------|
| "What's new?" | `get_articles` | `view: "newsfeed"`, `unread_only: true` |
| "How many articles today?" | `get_articles` | `view: "newsfeed"`, `count_only: true`, `date_from`, `date_to` (Pro) |
| "Today's recap" | `get_articles` | `count_only: true` first, then paginate with `limit: 100` and use the summary previews |
| "News from folder Tech" | `get_articles` | `view: "by-folder"`, `folder_id` |
| "Articles from Vercel blog" | `get_articles` | `view: "by-feed"`, `feed_id` |
| "Search for React" | `get_articles` | `view: "newsfeed"`, `query: "React"` |
| "Articles tagged AI" | `get_articles` | `view: "by-tag"`, `tag_id` |
| "Articles with highlights" | `get_articles` | `view: "highlighted"` |
| "Articles with notes" | `get_articles` | `view: "noted"` |
| "What did I read yesterday?" | `get_recently_read` | `since: "<yesterday ISO>"` (Pro) |
| "Full article content" | `get_article` | `article_id`: if it reads in under a minute, the feed probably sent an excerpt |
| "Load full content from URL" | `extract_article` | `article_id`, only when the content is truncated |

### Managing Read Status

| Intent | Tool |
|--------|------|
| "Mark as read" | `mark_as_read` |
| "Mark as unread" | `mark_as_unread` |
| "Mark all as read" | `mark_all_as_read` |

### Saving

| Intent | Tool |
|--------|------|
| "Save this article" | `save_article` |
| "Unsave this" | `unsave_article` |
| "Save this URL" | `save_url` |
| "Show saved articles" | `get_saved` |

### Highlights

| Intent | Tool |
|--------|------|
| "What did I highlight?" | `get_highlights` |
| "Highlight this passage" | `add_highlight` |
| "Remove a highlight" | `remove_highlight` |

### Notes

| Intent | Tool |
|--------|------|
| "Show note on this article" | `get_notes` |
| "Add a note" | `add_note` |
| "Delete the note" | `delete_note` |

### Tags

| Intent | Tool |
|--------|------|
| "Create a tag Security" | `create_tag` |
| "Delete a tag" | `delete_tag` |
| "Tag this as AI" | `tag_article` with `action: "add"` |
| "Remove AI tag" | `tag_article` with `action: "remove"` |
| "Show all tags" | `get_tags` |

### Organization & Info

| Intent | Tool |
|--------|------|
| "List my feeds" | `get_feeds` |
| "Find Bloomberg feeds" | `get_feeds` with `query: "bloomberg"` |
| "List my folders" | `get_folders` |
| "My reading stats" | `get_stats` |
| "My output feeds" | `get_output_feeds` |

## Best Practices

1. **Show titles and sources**, not just IDs: present each article as `title (source)`.
2. **Ask before bulk actions** like `mark_all_as_read`: confirm with the user first.
3. **Summarize and translate directly** from article content. Do NOT call any API for summarization or translation: use the content from `get_article` and process it yourself.
4. **Group articles by source** when presenting many results.
5. **Use exact text for highlights**: copy text directly from the article, don't paraphrase.
6. **Look up existing tags first**: call `get_tags` before creating duplicates. Only use `create_tag` if the tag doesn't exist.
7. **To find IDs**: call `get_feeds` to get feed IDs, `get_folders` for folder IDs, `get_tags` for tag IDs.

## Boundaries

These operations are **not available** through the plugin, so direct users to the FeedNest web app:

- Subscribe to or unsubscribe from feeds
- Search for new feeds to follow
- Create or manage folders
- Create output feeds
- Manage account settings or billing

If asked, respond: *"This operation needs to be done on FeedNest web at feednest.com."*

## Conversation Examples

**Daily recap / brief:**
1. On Pro, `get_articles` with `count_only: true`, `date_from`, `date_to` to check how many articles there are. On Free and Plus, call `get_articles` with `unread_only: true` and a `limit`, and use each article's publication date.
2. Paginate with `limit: 100` using the `before_published_at` and `before_id` cursors
3. Use the `summary_preview` field (~200 chars) to produce the recap, without reading each article
4. Group by source or topic when presenting results
5. Only call `get_article` for articles the user specifically wants to read in full

**Read an article (handle truncated RSS):**
1. `get_article` to get the content
2. If the reading time is under a minute, the RSS feed probably truncated the content
3. Call `extract_article` to fetch the full text from the original URL (Plus and Pro)
4. Do NOT extract every article, only the truncated ones

**Auto-tagging workflow (Plus and Pro):**
1. `get_articles` (unread, limit 20) to get today's articles
2. For each article, analyze the title and content
3. `get_tags` to check existing tags
4. If needed, `create_tag` to create missing tags
5. `tag_article` with `action: "add"` to apply tags

**Highlight key passages (Plus and Pro):**
1. `get_article` to get the full content
2. Analyze it and identify the key passages
3. `add_highlight` for each important passage, using the exact article text, not a paraphrase
