# FeedNest — Codex Plugin

> Your sources. Not the whole web. Ask your AI about your feeds — it already knows.

ChatGPT searches the internet. Perplexity crawls billions of pages. When you ask about your industry, your interests, your world — they give you everything except what matters.

**[FeedNest](https://www.feednest.com)** is different. Your AI works exclusively with the sources you choose: the blogs you trust, the publications you follow, the experts you believe in. No algorithmic noise. No black-box results. Intelligence grounded in your world.

This Codex plugin gives your agent direct access to your feeds, articles, highlights, notes, and tags through 26 tools.

## Prerequisites

1. A [FeedNest](https://www.feednest.com) account with a **Pro** subscription
2. An API key — generate one from **Settings → Developer API** in your dashboard

## Installation

### From the Plugin Directory

Open the Codex plugin directory and search for **FeedNest**:

```
codex
/plugins
```

### Local Installation

#### Option A: Repo-scoped

Copy the plugin into your repository and add a marketplace entry:

```bash
cp -R /path/to/codex-plugin ./plugins/feednest
```

Create `.agents/plugins/marketplace.json`:

```json
{
  "name": "local-repo",
  "plugins": [
    {
      "name": "feednest",
      "source": {
        "source": "local",
        "path": "./plugins/feednest"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Productivity"
    }
  ]
}
```

#### Option B: Personal (global)

```bash
cp -R /path/to/codex-plugin ~/.codex/plugins/feednest
```

Add to `~/.agents/plugins/marketplace.json`:

```json
{
  "name": "personal",
  "plugins": [
    {
      "name": "feednest",
      "source": {
        "source": "local",
        "path": "./.codex/plugins/feednest"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Productivity"
    }
  ]
}
```

## Configuration

Set your FeedNest API key as an environment variable:

```bash
export FEEDNEST_API_KEY="fn_live_..."
```

The plugin's MCP config reads `FEEDNEST_API_KEY` from the environment to authenticate with the FeedNest server.

## What Your Agent Can Do

- **Morning briefings** — summarize everything that happened overnight across your feeds
- **Compare coverage** — see how different sources report the same story
- **Spot trends** — detect emerging patterns before they hit mainstream
- **Deep-dive any topic** — synthesize from every source you follow
- **Track developing stories** — follow a narrative as it evolves
- **Instant search** — find any article across all your sources
- **Highlights and notes** — save what matters and annotate with your thoughts
- **Audio briefings** — turn any article into something you can listen to

## Tools (26)

### Reading (always available)

| Tool | Description |
|------|-------------|
| `get_articles` | List articles by view (newsfeed, by-feed, by-folder, by-tag, tagged, highlighted, noted) |
| `get_article` | Get full article detail with content, highlights, and notes |
| `get_saved` | List saved articles |
| `get_feeds` | List subscribed feeds with unread counts |
| `get_folders` | List feed folders |
| `get_tags` | List user tags with article counts |
| `get_highlights` | Get highlights from an article |
| `get_notes` | Get the note on an article |
| `get_recently_read` | Get recently read articles |
| `get_output_feeds` | List public RSS output feeds |
| `get_stats` | Reading statistics (streak, time, unread count) |

### Writing

| Tool | Description |
|------|-------------|
| `extract_article` | Load full content from the original URL |
| `mark_as_read` | Mark an article as read |
| `mark_as_unread` | Mark an article as unread |
| `mark_all_as_read` | Mark all articles as read (optionally by feed/folder) |
| `save_article` | Save an article for later |
| `unsave_article` | Remove from saved |
| `save_url` | Save an external URL |
| `create_tag` | Create a new tag |
| `delete_tag` | Delete a tag |
| `tag_article` | Add or remove a tag on an article |
| `add_highlight` | Highlight a text passage |
| `remove_highlight` | Remove a highlight |
| `add_note` | Add or update a note |
| `delete_note` | Delete a note |

### AI

| Tool | Description |
|------|-------------|
| `text_to_speech` | Generate audio from an article |

## Example Prompts

- "What's new in my feeds?" → lists unread articles
- "Give me a morning briefing" → summarizes today's articles by source
- "Summarize this article" → fetches full content and summarizes
- "Save this link" → saves an external URL
- "Tag today's articles" → analyzes and auto-tags
- "How's my reading streak?" → reading statistics

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Bearer token required" | Set `FEEDNEST_API_KEY` in your environment |
| "Invalid API key format" | Key must start with `fn_live_` followed by 32 hex characters |
| "Invalid or revoked API key" | Regenerate from Settings → Developer API |
| "API access requires a Pro subscription" | Upgrade to Pro at [feednest.com](https://www.feednest.com) |
| "Rate limit reached" | Wait a few minutes — limit is 1,000 requests/hour |
| Tools not appearing | Restart Codex after plugin installation |

## Links

- [FeedNest](https://www.feednest.com) — the app
- [Documentation](https://docs.feednest.com) — full docs with setup guides
- [AI Integrations](https://www.feednest.com/integrations) — all supported platforms
- [MCP Server](https://github.com/feednest-app/mcp) — remote MCP server and SDK

## License

MIT
