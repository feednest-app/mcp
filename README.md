# FeedNest MCP Server

> Your sources. Not the whole web. Ask your AI about your feeds - it already knows.

ChatGPT searches the internet. Perplexity crawls billions of pages. When you ask about your industry, your interests, your world - they give you everything except what matters.

**[FeedNest](https://www.feednest.com)** is different. Your AI works exclusively with the sources you choose: the blogs you trust, the publications you follow, the experts you believe in. No algorithmic noise. No black-box results. Intelligence grounded in your world.

This MCP server gives any AI assistant - **ChatGPT**, **Claude**, **Gemini**, **Grok**, **Cursor**, **Windsurf**, **Cline**, **Le Chat**, and more - direct access to your feeds, articles, highlights, notes, and tags through natural language.

<a href="https://www.feednest.com"><img src="https://img.shields.io/badge/feednest.com-Visit-orange?style=flat-square" alt="Website"></a>
<a href="https://docs.feednest.com"><img src="https://img.shields.io/badge/docs-feednest.com-blue?style=flat-square" alt="Docs"></a>

---

## What Your AI Can Do

Just ask. Your AI handles the rest.

- **Morning briefings** - Wake up to a summary of everything that happened overnight across your feeds
- **Compare coverage** - See how different sources report the same story, side by side
- **Spot trends early** - Your AI detects emerging patterns before they hit mainstream
- **Deep-dive any topic** - Get a comprehensive synthesis from every source you follow
- **Track developing stories** - Follow a narrative as it evolves across all your feeds
- **Instant search** - Find any article across all your sources in seconds
- **Highlights and notes** - Save what matters and annotate with your own thoughts
- **Audio briefings** - Turn any article or summary into something you can listen to

---

## Quick Start

### Prerequisites

1. A [FeedNest](https://www.feednest.com) account with a **Pro** subscription
2. An API key - generate one from **Settings → Developer API** in your dashboard

### ChatGPT

#### Option A: Web UI (OAuth - recommended)

1. Go to **Settings → Apps & Connectors → Advanced** and enable Developer Mode
2. Go to **Settings → Apps → Create**. Name it **FeedNest** and set the URL to `https://mcp.feednest.com`
3. ChatGPT will redirect you to FeedNest - log in and authorize

No API key needed. ChatGPT handles the OAuth flow automatically.

#### Option B: Responses API

Include FeedNest as an MCP tool in your API request:

```json
{
  "type": "mcp",
  "server_url": "https://mcp.feednest.com",
  "server_label": "feednest",
  "authorization": "fn_live_YOUR_API_KEY"
}
```

### Claude

#### Claude.ai Web (OAuth - recommended)

1. Click profile icon → **Settings → Connectors → Add custom connector**
2. Set **Name** to `FeedNest`, **Remote MCP server URL** to `https://mcp.feednest.com`
3. Leave OAuth Client ID and Secret empty. Click **Add** and authorize.

#### Claude Code

```bash
claude mcp add --transport http feednest https://mcp.feednest.com \
  --header "Authorization: Bearer fn_live_YOUR_API_KEY"
```

Add `-s user` for global access across all projects.

#### Claude Desktop (requires bridge)

Claude Desktop only supports stdio-based servers. Use the `mcp-remote` bridge:

```json
{
  "mcpServers": {
    "feednest": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://mcp.feednest.com",
        "--header", "Authorization:${AUTH_HEADER}"
      ],
      "env": {
        "AUTH_HEADER": "Bearer fn_live_YOUR_API_KEY"
      }
    }
  }
}
```

Config path: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS), `%APPDATA%\Claude\claude_desktop_config.json` (Windows), or `~/.config/Claude/claude_desktop_config.json` (Linux).

### Cursor

Add to `.cursor/mcp.json` in your project (or `~/.cursor/mcp.json` for global):

```json
{
  "mcpServers": {
    "feednest": {
      "url": "https://mcp.feednest.com",
      "headers": {
        "Authorization": "Bearer fn_live_YOUR_API_KEY"
      }
    }
  }
}
```

> **Tip:** Cursor supports env var interpolation: `"Bearer ${env:FEEDNEST_API_KEY}"`. Do **not** add a `"type"` field - Cursor auto-detects from the `"url"` key.

### Le Chat (Mistral)

Available on all plans, including the free tier.

1. Go to **Sidebar → Intelligence → Connectors**
2. Click **+ Add Connector → Custom MCP Connector**
3. Set **Name** to `FeedNest`, **Server URL** to `https://mcp.feednest.com`
4. Set **Auth type** to `API Token Authentication`, **Authorization** to `Bearer fn_live_YOUR_API_KEY`

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "feednest": {
      "serverUrl": "https://mcp.feednest.com",
      "headers": {
        "Authorization": "Bearer fn_live_YOUR_API_KEY"
      }
    }
  }
}
```

> **Important:** Windsurf uses `"serverUrl"` (not `"url"`). Using the wrong key causes a silent failure.

### Cline

In VS Code, open Cline extension settings → MCP Servers configuration (JSON):

```json
{
  "mcpServers": {
    "feednest": {
      "type": "streamableHttp",
      "url": "https://mcp.feednest.com",
      "headers": {
        "Authorization": "Bearer fn_live_YOUR_API_KEY"
      }
    }
  }
}
```

> **Critical:** The `"type": "streamableHttp"` field is **mandatory** for Cline. Without it, custom headers may fail silently and authentication won't work.

### Gemini CLI

Add to `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "feednest": {
      "httpUrl": "https://mcp.feednest.com",
      "headers": {
        "Authorization": "Bearer fn_live_YOUR_API_KEY"
      }
    }
  }
}
```

> **Note:** Gemini CLI uses `"httpUrl"` (not `"url"`). The `"url"` field is reserved for SSE transport. CLI only - gemini.google.com does not support external MCP servers.

### Grok (xAI)

Available through the xAI API/SDK only, not from the grok.com chat UI.

```bash
curl https://api.x.ai/v1/responses \
  -H "Authorization: Bearer $XAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "grok-3",
    "tools": [{
      "type": "mcp",
      "server_url": "https://mcp.feednest.com",
      "server_label": "feednest",
      "authorization": "Bearer fn_live_YOUR_API_KEY"
    }],
    "input": "What are my unread articles?"
  }'
```

### Any other MCP client

Any client supporting Streamable HTTP can connect using:

- **URL**: `https://mcp.feednest.com`
- **Header**: `Authorization: Bearer fn_live_YOUR_API_KEY`

For stdio-only clients, use the [mcp-remote](https://github.com/geelen/mcp-remote) bridge:

```json
{
  "mcpServers": {
    "feednest": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://mcp.feednest.com",
        "--header", "Authorization:Bearer fn_live_YOUR_API_KEY"
      ]
    }
  }
}
```

---

## Tools (26)

### Articles

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `get_articles` | List articles with title, source, date, and summary preview. Views: newsfeed, by-feed, by-folder, by-tag, tagged, highlighted, noted. | `view`\*, `feed_id`, `folder_id`, `tag_id`, `limit`, `query`, `sort`, `unread_only`, `date_from`, `date_to`, `count_only` |
| `get_article` | Get full article content including highlights, notes, and reading time. | `article_id`\* |
| `extract_article` | Fetch full content from the original URL when RSS truncated it. | `article_id`\* |

### Read Status

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `mark_as_read` | Mark an article as read. | `article_id`\* |
| `mark_as_unread` | Mark an article as unread. | `article_id`\* |
| `mark_all_as_read` | Mark all articles as read, optionally filtered by feed or folder. | `feed_id`, `folder_id` |

### Saving

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `save_article` | Save an article for later reading. | `article_id`\* |
| `unsave_article` | Remove an article from saved items. | `article_id`\* |
| `save_url` | Save an external URL for later reading. | `url`\* |
| `get_saved` | List saved articles with search, date filtering, and sorting. | `limit`, `query`, `sort`, `date_from`, `date_to` |

### Feeds & Structure

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `get_feeds` | List subscribed feeds with unread counts. Search by name. | `folder_id`, `query`, `limit` |
| `get_folders` | List all feed folders with feed counts. | - |
| `get_tags` | List all tags with article counts. | - |

### Tagging

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `create_tag` | Create a new tag for categorizing articles. | `name`\*, `color` |
| `delete_tag` | Delete a tag by ID. | `tag_id`\* |
| `tag_article` | Add or remove a tag on an article. | `article_id`\*, `tag_id`\*, `action`\* (`add`/`remove`) |

### Highlights

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `get_highlights` | Get all text highlights from an article. | `article_id`\* |
| `add_highlight` | Highlight a text passage. The text must exist exactly in the article. | `article_id`\*, `text`\*, `color` |
| `remove_highlight` | Remove a highlight from an article. | `article_id`\*, `highlight_id`\* |

### Notes

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `get_notes` | Get the note on an article. | `article_id`\* |
| `add_note` | Add or update a note on an article. | `article_id`\*, `content`\* |
| `delete_note` | Delete a note from an article. | `article_id`\* |

### History

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `get_recently_read` | Get recently opened articles. Supports search and date filtering. | `limit`, `since`, `date_to`, `query`, `sort` |

### Output Feeds

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `get_output_feeds` | List public RSS output feeds created by the user. | - |

### AI

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `text_to_speech` | Generate audio from an article using text-to-speech. | `article_id`\* |

### Stats

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `get_stats` | Reading streak, articles read today, reading time, total feeds, unread count, saved count. | - |

\* = required parameter

---

## Example Conversation

```
You: "What's happening in AI today?"

ChatGPT: "Based on your tech feeds, here are today's 3 biggest stories:

1. OpenAI announced GPT-5, covered first in your Hacker News feed
2. EU AI Act enforcement begins, mentioned across 4 of your sources
3. Google published new Gemini research, from your AI folder

Want me to summarize any of them?"
```

### More things you can ask

- *"Give me a morning briefing from my feeds"*
- *"Compare how Bloomberg and Reuters covered this story"*
- *"What did I read yesterday?"*
- *"Save this article and highlight the key findings"*
- *"Tag all AI-related articles with 'Machine Learning'"*
- *"How's my reading streak going?"*
- *"Turn this article into audio"*

---

## Authentication

### API Key (personal use)

Generate a key from **Settings → Developer API** in the FeedNest dashboard. Keys start with `fn_live_` followed by 32 hex characters.

```
Authorization: Bearer fn_live_abc123...
```

### OAuth 2.1 (third-party apps)

The server supports full OAuth 2.1 with PKCE. Discovery endpoint:

```
https://mcp.feednest.com/.well-known/oauth-protected-resource
```

ChatGPT and Claude.ai handle OAuth automatically - no API key needed for those.

### Scopes

| Scope | Access |
|-------|--------|
| `read` | All read-only tools (get_articles, get_feeds, get_stats, etc.) |
| `write` | All mutation tools (mark_as_read, save_article, add_highlight, etc.) |
| `ai` | AI tools (text_to_speech) |

---

## You Stay in Control

- **You choose what's visible** - Pick exactly which feeds, folders, and actions your AI can access
- **Encrypted and verified** - Every request is secured so no one else can reach your data
- **Built-in usage limits** - 1,000 requests/hour per key, your account stays protected
- **Revoke access instantly** - One click from your dashboard

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Bearer token required" | Check that the `Authorization` header is set correctly |
| "Invalid API key format" | Key must start with `fn_live_` followed by 32 hex characters |
| "Invalid or revoked API key" | Regenerate from Settings → Developer API |
| "API access requires a Pro subscription" | Upgrade to Pro at [feednest.com](https://www.feednest.com) |
| "Rate limit reached" | Wait a few minutes and retry |
| "Insufficient scope" | Your API key doesn't have the required scope |
| Tools not appearing | Restart your AI client after changing MCP configuration |

---

## Links

- [FeedNest](https://www.feednest.com) - the app
- [Documentation](https://docs.feednest.com) - full docs with setup guides per platform
- [Integrations](https://www.feednest.com/integrations) - see all AI integrations

## License

MIT
