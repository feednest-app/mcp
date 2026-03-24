/**
 * FeedNest OpenClaw Plugin.
 *
 * Registers 26 agent tools that map 1:1 to FeedNest MCP/API tools.
 * Uses the SDK for HTTP calls and shared-tool-defs for schemas + formatters.
 *
 * @module
 */

import { FeedNestClient, FeedNestError } from "@feednest/sdk";
import {
  formatArticleDetail,
  formatArticleList,
  formatError,
  formatFeedList,
  formatFolderList,
  formatHighlightList,
  formatNoteDetail,
  formatOutputFeedList,
  formatRecentlyReadList,
  formatSavedList,
  formatStats,
  formatTagList,
  toJsonSchema,
  tools,
} from "@feednest/shared-tool-defs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ToolSpec {
  description: string;
  execute: (
    _id: string,
    params: Record<string, unknown>
  ) => Promise<ToolResult>;
  name: string;
  parameters: Record<string, unknown>;
}

interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
}

interface PluginApi {
  config: { apiKey?: string };
  registerTool: (spec: ToolSpec, opts?: { optional: boolean }) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function text(value: string): ToolResult {
  return { content: [{ type: "text", text: value }] };
}

function errorResult(err: unknown): ToolResult {
  if (err instanceof FeedNestError) {
    return text(formatError({ code: err.code, message: err.message }));
  }
  return text(formatError({ code: "INTERNAL_ERROR" }));
}

type ToolHandler = (
  client: FeedNestClient,
  p: Record<string, unknown>
) => Promise<ToolResult>;

/**
 * Map of MCP tool name → handler function.
 *
 * The handler receives the SDK client and the raw params from the LLM.
 * Each handler calls the corresponding SDK method, formats the result
 * with shared-tool-defs formatters, and returns an MCP-compatible content
 * object. Errors are caught and formatted consistently.
 */
const handlers: Record<
  string,
  { scope: "read" | "write" | "ai"; handler: ToolHandler }
> = {
  // --- Articles (3) ---
  get_articles: {
    scope: "read",
    handler: async (client, p) => {
      const view = p.view as string;
      const opts = {
        limit: p.limit as number | undefined,
        beforePublishedAt: p.before_published_at as string | undefined,
        beforeId: p.before_id as string | undefined,
        unreadOnly: p.unread_only as boolean | undefined,
        query: p.query as string | undefined,
        dateFrom: p.date_from as string | undefined,
        dateTo: p.date_to as string | undefined,
        sort: p.sort as "newest" | "oldest" | undefined,
        countOnly: p.count_only as boolean | undefined,
      };

      const viewFn: Record<
        string,
        () => Promise<{ data: unknown[]; hasMore: boolean }>
      > = {
        newsfeed: () => client.getNewsfeedArticles(opts),
        "by-feed": () => client.getArticlesByFeed(p.feed_id as string, opts),
        "by-folder": () =>
          client.getArticlesByFolder(p.folder_id as string, opts),
        "by-tag": () => client.getArticlesByTag(p.tag_id as string, opts),
        tagged: () => client.getArticlesWithTags(opts),
        highlighted: () => client.getArticlesWithHighlights(opts),
        noted: () => client.getArticlesWithNotes(opts),
      };

      const fn = viewFn[view];
      if (!fn) {
        return text(
          formatError({
            code: "VALIDATION_ERROR",
            message: `Unknown view: ${view}`,
          })
        );
      }

      // count_only returns { count, capped } instead of articles
      if (opts.countOnly) {
        const res = await fn();
        const countData = (
          res as unknown as { data: { count: number; capped: boolean } }
        ).data;
        if (countData && typeof countData.count === "number") {
          return text(
            countData.capped
              ? `More than ${countData.count} articles found.`
              : `${countData.count} articles found.`
          );
        }
      }

      const { data, hasMore } = await fn();
      const list = formatArticleList(
        data as Parameters<typeof formatArticleList>[0]
      );
      return text(
        hasMore
          ? `${list}\n\n(More articles available — use pagination cursors)`
          : list
      );
    },
  },

  get_article: {
    scope: "read",
    handler: async (client, p) => {
      const article = await client.getArticle(p.article_id as string);
      return text(formatArticleDetail(article));
    },
  },

  extract_article: {
    scope: "write",
    handler: async (client, p) => {
      const article = await client.extractArticle(p.article_id as string);
      return text(formatArticleDetail(article));
    },
  },

  // --- Reading (3) ---
  mark_as_read: {
    scope: "write",
    handler: async (client, p) => {
      await client.markAsRead(p.article_id as string);
      return text("Article marked as read.");
    },
  },

  mark_as_unread: {
    scope: "write",
    handler: async (client, p) => {
      await client.markAsUnread(p.article_id as string);
      return text("Article marked as unread.");
    },
  },

  mark_all_as_read: {
    scope: "write",
    handler: async (client, p) => {
      await client.markAllAsRead({
        feedId: p.feed_id as string | undefined,
        folderId: p.folder_id as string | undefined,
      });
      return text("All articles marked as read.");
    },
  },

  // --- Saving (4) ---
  save_article: {
    scope: "write",
    handler: async (client, p) => {
      await client.saveArticle(p.article_id as string);
      return text("Article saved.");
    },
  },

  unsave_article: {
    scope: "write",
    handler: async (client, p) => {
      await client.unsaveArticle(p.article_id as string);
      return text("Article removed from saved.");
    },
  },

  save_url: {
    scope: "write",
    handler: async (client, p) => {
      const saved = await client.saveUrl(p.url as string);
      return text(`URL saved: ${saved.title ?? saved.url}`);
    },
  },

  get_saved: {
    scope: "read",
    handler: async (client, p) => {
      const { data, hasMore } = await client.getSavedArticles({
        limit: p.limit as number | undefined,
        beforePublishedAt: p.before_published_at as string | undefined,
        beforeId: p.before_id as string | undefined,
        query: p.query as string | undefined,
        dateFrom: p.date_from as string | undefined,
        dateTo: p.date_to as string | undefined,
        sort: p.sort as "newest" | "oldest" | undefined,
      });
      const list = formatSavedList(data);
      return text(
        hasMore ? `${list}\n\n(More saved articles available)` : list
      );
    },
  },

  // --- Feeds (3) ---
  get_feeds: {
    scope: "read",
    handler: async (client, p) => {
      const { data, hasMore } = await client.getFeeds({
        folderId: p.folder_id as string | undefined,
        query: p.query as string | undefined,
        limit: p.limit as number | undefined,
        beforeName: p.before_name as string | undefined,
        beforeId: p.before_id as string | undefined,
      });
      const list = formatFeedList(data);
      return text(hasMore ? `${list}\n\n(More feeds available)` : list);
    },
  },

  get_folders: {
    scope: "read",
    handler: async (client) => {
      const folders = await client.getFolders();
      return text(formatFolderList(folders));
    },
  },

  get_tags: {
    scope: "read",
    handler: async (client) => {
      const tags = await client.getTags();
      return text(formatTagList(tags));
    },
  },

  // --- Tagging (2) ---
  create_tag: {
    scope: "write",
    handler: async (client, p) => {
      const tag = await client.createTag(
        p.name as string,
        p.color as string | undefined
      );
      return text(`Tag created: ${tag.name} (${tag.id})`);
    },
  },

  delete_tag: {
    scope: "write",
    handler: async (client, p) => {
      await client.deleteTag(p.tag_id as string);
      return text("Tag deleted.");
    },
  },

  tag_article: {
    scope: "write",
    handler: async (client, p) => {
      const action = p.action as "add" | "remove";
      if (action === "remove") {
        await client.untagArticle(p.article_id as string, p.tag_id as string);
        return text("Tag removed from article.");
      }
      await client.tagArticle(p.article_id as string, p.tag_id as string);
      return text("Tag added to article.");
    },
  },

  // --- Highlights (3) ---
  get_highlights: {
    scope: "read",
    handler: async (client, p) => {
      const highlights = await client.getHighlights(p.article_id as string);
      return text(formatHighlightList(highlights));
    },
  },

  add_highlight: {
    scope: "write",
    handler: async (client, p) => {
      const h = await client.addHighlight(
        p.article_id as string,
        p.text as string,
        p.color as string | undefined
      );
      return text(`Highlight added: "${h.text}" [${h.color}]`);
    },
  },

  remove_highlight: {
    scope: "write",
    handler: async (client, p) => {
      await client.removeHighlight(
        p.article_id as string,
        p.highlight_id as string
      );
      return text("Highlight removed.");
    },
  },

  // --- Notes (3) ---
  get_notes: {
    scope: "read",
    handler: async (client, p) => {
      const note = await client.getNotes(p.article_id as string);
      return text(formatNoteDetail(note));
    },
  },

  add_note: {
    scope: "write",
    handler: async (client, p) => {
      const note = await client.addNote(
        p.article_id as string,
        p.content as string
      );
      return text(`Note saved (${note.total_notes_count} total).`);
    },
  },

  delete_note: {
    scope: "write",
    handler: async (client, p) => {
      await client.deleteNote(p.article_id as string);
      return text("Note deleted.");
    },
  },

  // --- History (1) ---
  get_recently_read: {
    scope: "read",
    handler: async (client, p) => {
      const { data, hasMore } = await client.getRecentlyRead({
        limit: p.limit as number | undefined,
        since: p.since as string | undefined,
        dateTo: p.date_to as string | undefined,
        beforeOpenedAt: p.before_opened_at as string | undefined,
        beforeId: p.before_id as string | undefined,
        query: p.query as string | undefined,
        sort: p.sort as "newest" | "oldest" | undefined,
      });
      const list = formatRecentlyReadList(data);
      return text(hasMore ? `${list}\n\n(More history available)` : list);
    },
  },

  // --- Output Feeds (1) ---
  get_output_feeds: {
    scope: "read",
    handler: async (client) => {
      const feeds = await client.getOutputFeeds();
      return text(formatOutputFeedList(feeds));
    },
  },

  // --- AI (1) ---
  text_to_speech: {
    scope: "ai",
    handler: async (client, p) => {
      const result = await client.textToSpeech(p.article_id as string);
      if (result.status === "in_progress") {
        return text("Audio generation is in progress. Try again in a moment.");
      }
      if (!result.audio_url) {
        return text(
          formatError({
            code: "INTERNAL_ERROR",
            message: "No audio URL returned.",
          })
        );
      }
      return text(
        `Audio ready: ${result.audio_url}\nDuration: ~${Math.round(result.duration_seconds / 60)} min`
      );
    },
  },

  // --- Stats (1) ---
  get_stats: {
    scope: "read",
    handler: async (client) => {
      const stats = await client.getStats();
      return text(formatStats(stats));
    },
  },
};

// ---------------------------------------------------------------------------
// Plugin registration
// ---------------------------------------------------------------------------

/** Exported tool names for testing and verification. */
export const TOOL_PREFIX = "feednest_";

export default function register(api: PluginApi): void {
  const apiKey = api.config.apiKey;
  if (!apiKey) {
    throw new Error(
      "FeedNest API key is required. Set it in your OpenClaw config: { apiKey: 'fn_live_...' }"
    );
  }

  const client = new FeedNestClient({ apiKey });

  for (const tool of tools) {
    const entry = handlers[tool.name];
    if (!entry) {
      continue;
    }

    const isOptional = entry.scope !== "read";

    api.registerTool(
      {
        name: `${TOOL_PREFIX}${tool.name}`,
        description: tool.description,
        parameters: toJsonSchema(tool.name),
        async execute(_id: string, params: Record<string, unknown>) {
          try {
            return await entry.handler(client, params);
          } catch (err) {
            return errorResult(err);
          }
        },
      },
      { optional: isOptional }
    );
  }
}
