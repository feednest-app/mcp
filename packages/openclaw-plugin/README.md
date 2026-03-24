# @feednest/openclaw

OpenClaw plugin for [FeedNest](https://feednest.com). Your sources inside your AI, on WhatsApp, Telegram, Slack, and every channel you use. Articles, highlights, notes, tags, and audio from the sources you trust.

## Prerequisites

- [OpenClaw](https://github.com/openclaw/openclaw) installed
- A FeedNest account with a **Pro subscription** ($19.99/mo)
- A FeedNest API key (get one at **Settings → Developer API** on feednest.com)

## Installation

```bash
openclaw plugins install @feednest/openclaw
```

## Configuration

Add your API key to your OpenClaw config:

```json5
{
  plugins: {
    feednest: {
      apiKey: "fn_live_..."
    }
  }
}
```

## Tools

All tools use the `feednest_` prefix. Read-only tools are enabled by default; write/AI tools are optional and require explicit allowlisting.

### Reading (always enabled)

| Tool | Description |
|------|-------------|
| `feednest_get_articles` | List articles by view (newsfeed, by-feed, by-folder, by-tag, tagged, highlighted, noted) |
| `feednest_get_article` | Get full article detail with content, highlights, and notes |
| `feednest_get_saved` | List saved articles |
| `feednest_get_feeds` | List subscribed feeds with unread counts |
| `feednest_get_folders` | List feed folders |
| `feednest_get_tags` | List user tags with article counts |
| `feednest_get_highlights` | Get highlights from an article |
| `feednest_get_notes` | Get the note on an article |
| `feednest_get_recently_read` | Get recently read articles |
| `feednest_get_output_feeds` | List public RSS output feeds |
| `feednest_get_stats` | Reading statistics (streak, time, unread count) |

### Writing (optional — requires allowlisting)

| Tool | Description |
|------|-------------|
| `feednest_extract_article` | Load full content from the original URL |
| `feednest_mark_as_read` | Mark an article as read |
| `feednest_mark_as_unread` | Mark an article as unread |
| `feednest_mark_all_as_read` | Mark all articles as read (optionally by feed/folder) |
| `feednest_save_article` | Save an article for later |
| `feednest_unsave_article` | Remove from saved |
| `feednest_save_url` | Save an external URL |
| `feednest_create_tag` | Create a new tag |
| `feednest_tag_article` | Add or remove a tag on an article |
| `feednest_add_highlight` | Highlight a text passage |
| `feednest_remove_highlight` | Remove a highlight |
| `feednest_add_note` | Add or update a note |
| `feednest_delete_note` | Delete a note |

### AI (optional — requires allowlisting)

| Tool | Description |
|------|-------------|
| `feednest_text_to_speech` | Generate audio from an article |

### Enabling optional tools

Add tool names or the plugin ID to your agent's `allow` list:

```json5
{
  agents: {
    list: [{
      id: "main",
      tools: {
        allow: [
          "feednest",                    // all feednest tools
          // or individually:
          "feednest_mark_as_read",
          "feednest_save_article",
          "feednest_text_to_speech",
        ]
      }
    }]
  }
}
```

## Example Prompts

- "What's new in my feeds?" → `feednest_get_articles` (newsfeed, unread)
- "Summarize this article" → `feednest_get_article` → agent summarizes the content directly
- "Save this link" → `feednest_save_url`
- "Tag today's articles" → `feednest_get_articles` → analyze → `feednest_create_tag` / `feednest_tag_article`
- "My reading stats" → `feednest_get_stats`

## Troubleshooting

| Error | Solution |
|-------|----------|
| "API key is required" | Add `apiKey` to your OpenClaw feednest plugin config |
| "Authentication failed" | Check that your API key is valid and starts with `fn_live_` |
| "This feature requires a FeedNest Pro subscription" | Upgrade to Pro at feednest.com/pricing |
| "Too many requests" | Wait a moment — rate limit is 1,000 requests/hour |

## Links

- [FeedNest](https://www.feednest.com)
- [Documentation](https://docs.feednest.com)
- [AI Integrations](https://www.feednest.com/integrations)

## License

MIT
