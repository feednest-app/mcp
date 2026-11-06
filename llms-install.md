# Installing FeedNest in Cline

FeedNest is a hosted MCP server at `https://mcp.feednest.com`. There is
nothing to clone, build or run: Cline connects to the URL.

## Option A: sign in with a FeedNest account (every plan, no API key)

1. In Cline, open **MCP Servers**, then the **Remote Servers** tab.
2. Fill in:
   - **Server Name:** `feednest`
   - **Server URL:** `https://mcp.feednest.com`
   - **Transport Type:** Streamable HTTP
3. Click **Add Server**. The same entry in the MCP settings JSON:

   ```json
   {
     "mcpServers": {
       "feednest": {
         "type": "streamableHttp",
         "url": "https://mcp.feednest.com"
       }
     }
   }
   ```

4. Authorize. The server answers the first request with `401` and its OAuth
   metadata, and Cline opens the browser to sign in. With the Cline CLI, run
   `cline mcp` and choose **Authorize OAuth** for `feednest`. Sign in with your
   FeedNest account (a free account is enough) and allow the connection.
5. Check it works: ask Cline "What's new in my feeds?". It should call
   `get_articles` and answer from your sources.

On the Free plan Cline can read your feeds, articles, saved articles, tags and
highlights, up to 20 requests an hour. Plus and Pro also let it save, tag,
highlight, take notes and mark articles as read.

## Option B: an API key (Pro)

Create a key in FeedNest under **Settings → Developer API**, then:

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

## Notes

- Keep `"type": "streamableHttp"`: it is required. Without it Cline uses the
  legacy SSE transport, and the sign-in and the headers do not work.
- The 25 tools and what each needs are listed in the [README](./README.md#tools-25).
- Help: support@feednest.com
