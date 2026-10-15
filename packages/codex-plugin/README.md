# FeedNest Plugin for ChatGPT and Codex

> Your sources. Not the whole web. Ask your AI about your feeds: it already knows.

ChatGPT searches the internet. Perplexity crawls billions of pages. When you ask about your industry, your interests, your world, they give you everything except what matters.

**[FeedNest](https://www.feednest.com)** is different. Your AI works exclusively with the sources you choose: the blogs you trust, the publications you follow, the experts you believe in. No algorithmic noise. No black-box results. Intelligence grounded in your world.

This plugin gives ChatGPT and Codex direct access to your feeds, articles, highlights, notes, and tags through 25 tools.

## Prerequisites

A [FeedNest](https://www.feednest.com) account on any plan. You sign in with it when the plugin connects (OAuth), so there is no API key to create.

| Plan | What the plugin can do |
|------|------------------------|
| Free | Read feeds, folders, articles, saved articles, tags, and highlights, up to 20 tool calls an hour. Nothing can be changed. |
| Plus | Everything in Free, plus notes, reading stats, full article text, and every write: save, tag, highlight, mark as read. |
| Pro | Everything in Plus, plus date filters. |

## Installation

FeedNest is not in the plugin directory shared by ChatGPT and Codex yet. Until it is, install the plugin locally in Codex.

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

## Signing In

Nothing to configure. The plugin's MCP config (`.mcp.json`) points at `https://mcp.feednest.com` and uses OAuth with dynamic client registration: the first time the plugin connects, your browser opens the FeedNest sign-in and consent screen. If it does not open on its own in Codex, run:

```bash
codex mcp login feednest
```

## What Your Agent Can Do

- **Morning briefings**: summarize everything that happened overnight across your feeds
- **Compare coverage**: see how different sources report the same story
- **Spot trends**: detect emerging patterns before they hit mainstream
- **Deep-dive any topic**: synthesize from every source you follow
- **Track developing stories**: follow a narrative as it evolves
- **Instant search**: find any article across all your sources
- **Highlights and notes**: save what matters and annotate with your thoughts

## Tools (25)

On the Free plan the plugin can read but not change anything. Notes, reading stats, the highlighted and noted views, and `extract_article` are part of Plus and Pro, and date filters need Pro.

### Reading

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

`text_to_speech` is not exposed by the hosted MCP server: it generates audio with
an AI model, which the Claude connectors directory does not allow. Reading articles
aloud stays available in the FeedNest app and through the OpenClaw plugin.

## Example Prompts

- "What's new in my feeds?" → lists unread articles
- "Give me a morning briefing" → summarizes today's articles by source
- "Summarize this article" → fetches full content and summarizes
- "Save this link" → saves an external URL
- "Tag today's articles" → analyzes and auto-tags
- "How's my reading streak?" → reading statistics

## Troubleshooting

| Message or symptom | Solution |
|--------------------|----------|
| The sign-in page does not open | Run `codex mcp login feednest` |
| "... is included in FeedNest Plus and Pro" | The connection is on the Free plan. After a plan change, reconnect FeedNest |
| "... 20 requests an hour from AI assistants, and they are used up" | The Free plan's hourly allowance. Try again after the time in the message |
| "Rate limit reached" | Wait a few minutes: the server allows 1,000 requests an hour |
| Tools not appearing | Restart Codex after installing the plugin |

## Links

- [FeedNest](https://www.feednest.com): the app
- [Documentation](https://docs.feednest.com): full docs with setup guides
- [AI Integrations](https://www.feednest.com/integrations): all supported platforms
- [MCP Server](https://github.com/feednest-app/mcp): remote MCP server and SDK

## License

MIT
