# FeedNest Plugin for Claude

> Your sources. Not the whole web. Ask Claude about your feeds: it already knows.

**[FeedNest](https://www.feednest.com)** is a news reader built around the sources you choose: the blogs you trust, the publications you follow, the experts you believe in. This plugin connects Claude Code and Cowork to your FeedNest account, so Claude answers from your feeds instead of the open web.

It bundles three things:

- **The FeedNest connection**: the remote MCP server at `https://mcp.feednest.com`, with its 25 tools for articles, feeds, folders, saved articles, highlights, notes and tags.
- **A skill** that tells Claude which tool fits which request and how to keep the number of calls low.
- **A command**, `/feednest:briefing`, for a briefing of what's new in your feeds, grouped by topic.

## Prerequisites

A [FeedNest](https://www.feednest.com) account on any plan. You sign in with it when the plugin connects (OAuth), so there is no API key to create.

| Plan | What the plugin can do |
|------|------------------------|
| Free | Read feeds, folders, articles, saved articles, tags and highlights, up to 20 tool calls an hour. Nothing can be changed. |
| Plus | Everything in Free, plus notes, reading stats, full article text, and every write: save, tag, highlight, mark as read. |
| Pro | Everything in Plus, plus date filters. |

## Installation

### Claude Code

```
/plugin marketplace add feednest-app/mcp
/plugin install feednest@feednest
```

Then run `/mcp`, pick **feednest** and sign in: your browser opens the FeedNest sign-in and consent screen. From a terminal, `claude plugin install feednest --marketplace feednest-app/mcp` does both steps at once.

### Cowork and Claude chat

In **Customize → Plugins → Add → Add marketplace**, enter `https://github.com/feednest-app/mcp` and install **FeedNest**. Then connect FeedNest from the plugin's **Connectors** tab.

If you also connected FeedNest from Claude's connectors directory, you still get one set of FeedNest tools, not two: the plugin uses the same server address.

## Usage

```
/feednest:briefing
/feednest:briefing AI and chips
/feednest:briefing folder Markets, last two days
```

Or just ask: "What have my sources published about the election this week?", "Compare how my sources covered the latest Apple event", "Highlight the key passages of this article".

## Troubleshooting

| Message or symptom | Solution |
|--------------------|----------|
| The FeedNest tools are missing | Run `/mcp` and sign in to **feednest** |
| "... is included in FeedNest Plus and Pro" | The connection is on the Free plan. After a plan change, reconnect FeedNest from `/mcp` |
| "... 20 requests an hour from AI assistants, and they are used up" | The Free plan's hourly allowance. Try again after the time in the message |
| "Rate limit reached" | Wait a few minutes: the server allows 1,000 requests an hour |

## Links

- [FeedNest](https://www.feednest.com): the app
- [Documentation](https://docs.feednest.com): setup guides for every assistant
- [Privacy policy](https://www.feednest.com/privacy) and [terms](https://www.feednest.com/terms)
- [Support](https://www.feednest.com/contact)

## License

MIT
