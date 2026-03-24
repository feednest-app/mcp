/**
 * Shared MCP tool definitions for FeedNest.
 *
 * Each tool maps 1:1 to an SDK method (or a consolidated set of methods).
 * Zod schemas are the single source of truth for parameter validation.
 *
 * @module
 */

import { z } from "zod";

/** MCP tool annotations describing the tool's impact level. */
export interface ToolAnnotations {
  /** True if the tool can cause irreversible changes (delete, overwrite). */
  destructiveHint: boolean;
  /** True if calling the tool again with the same args has no extra effect. */
  idempotentHint?: boolean;
  /** True if the tool can affect publicly visible internet state. */
  openWorldHint: boolean;
  /** True if the tool only reads data and never modifies state. */
  readOnlyHint: boolean;
}

/** ChatGPT status text shown while a tool runs and after completion (max 64 chars). */
export interface ToolInvocationText {
  invoked: string;
  invoking: string;
}

export interface ToolDefinition {
  annotations: ToolAnnotations;
  description: string;
  /** Status text shown in the ChatGPT UI during/after tool execution. */
  invocationText: ToolInvocationText;
  name: string;
  parameters: z.ZodType;
  /** Human-readable display name shown in the ChatGPT UI. */
  title: string;
}

// ---------------------------------------------------------------------------
// Article views (7 SDK methods → 1 tool with `view` discriminator)
// ---------------------------------------------------------------------------

const articleViewEnum = z.enum([
  "newsfeed",
  "by-feed",
  "by-folder",
  "by-tag",
  "tagged",
  "highlighted",
  "noted",
]);

const articleListParams = z.object({
  view: articleViewEnum.describe(
    "Which article view to query. Use 'newsfeed' for the main feed."
  ),
  feed_id: z.string().optional().describe("Required when view is 'by-feed'."),
  folder_id: z
    .string()
    .optional()
    .describe("Required when view is 'by-folder'."),
  tag_id: z.string().optional().describe("Required when view is 'by-tag'."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Max articles to return (1–100)."),
  before_published_at: z
    .string()
    .optional()
    .describe("Keyset cursor: ISO-8601 published_at of the last article."),
  before_id: z
    .string()
    .optional()
    .describe("Keyset cursor: ID of the last article."),
  unread_only: z.boolean().optional().describe("Only return unread articles."),
  query: z.string().optional().describe("Full-text search query."),
  date_from: z
    .string()
    .optional()
    .describe("Filter: earliest date (ISO-8601)."),
  date_to: z.string().optional().describe("Filter: latest date (ISO-8601)."),
  sort: z.enum(["newest", "oldest"]).optional().describe("Sort order."),
  count_only: z
    .boolean()
    .optional()
    .describe(
      "When true, return only the article count instead of the full list. Useful for questions like 'how many articles yesterday?'."
    ),
});

// ---------------------------------------------------------------------------
// Recently Read
// ---------------------------------------------------------------------------

const recentlyReadParams = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Max articles to return (1–100)."),
  since: z
    .string()
    .optional()
    .describe("Only articles opened after this date (ISO-8601)."),
  date_to: z
    .string()
    .optional()
    .describe("Only articles opened before this date (ISO-8601)."),
  before_opened_at: z
    .string()
    .optional()
    .describe("Keyset cursor: ISO-8601 opened_at of the last article."),
  before_id: z
    .string()
    .optional()
    .describe("Keyset cursor: ID of the last article."),
  query: z.string().optional().describe("Full-text search query."),
  sort: z.enum(["newest", "oldest"]).optional().describe("Sort order."),
});

// ---------------------------------------------------------------------------
// Annotation presets (all FeedNest tools are closed-world — no public writes)
// ---------------------------------------------------------------------------

const READ_ONLY: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
  idempotentHint: true,
};

const WRITE: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  openWorldHint: false,
};

const WRITE_IDEMPOTENT: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  openWorldHint: false,
  idempotentHint: true,
};

const DESTRUCTIVE_IDEMPOTENT: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
  openWorldHint: false,
  idempotentHint: true,
};

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

export const tools: ToolDefinition[] = [
  // --- Articles (3) ---
  {
    name: "get_articles",
    title: "List articles",
    description:
      "List articles with title, source, date, and summary preview. " +
      "Views: newsfeed, by-feed, by-folder, by-tag, tagged, highlighted, noted. " +
      "Use count_only=true to check volume before loading full lists.",
    parameters: articleListParams,
    annotations: READ_ONLY,
    invocationText: {
      invoking: "Fetching articles…",
      invoked: "Articles loaded",
    },
  },
  {
    name: "get_article",
    title: "Read article",
    description:
      "Get full article content, highlights, notes, and reading time. " +
      "If content is truncated (<1 min read), use extract_article to fetch the full text.",
    parameters: z.object({
      article_id: z.string().describe("The article ID."),
    }),
    annotations: READ_ONLY,
    invocationText: { invoking: "Loading article…", invoked: "Article loaded" },
  },
  {
    name: "extract_article",
    title: "Extract full content",
    description:
      "Fetch full article content from the original URL. Only needed when get_article returns truncated content.",
    parameters: z.object({
      article_id: z.string().describe("The article ID to extract content for."),
    }),
    annotations: WRITE_IDEMPOTENT,
    invocationText: {
      invoking: "Extracting content…",
      invoked: "Content extracted",
    },
  },

  // --- Reading (3) ---
  {
    name: "mark_as_read",
    title: "Mark as read",
    description: "Mark an article as read.",
    parameters: z.object({
      article_id: z.string().describe("The article ID to mark as read."),
    }),
    annotations: WRITE_IDEMPOTENT,
    invocationText: { invoking: "Updating status…", invoked: "Marked as read" },
  },
  {
    name: "mark_as_unread",
    title: "Mark as unread",
    description: "Mark an article as unread.",
    parameters: z.object({
      article_id: z.string().describe("The article ID to mark as unread."),
    }),
    annotations: WRITE_IDEMPOTENT,
    invocationText: {
      invoking: "Updating status…",
      invoked: "Marked as unread",
    },
  },
  {
    name: "mark_all_as_read",
    title: "Mark all as read",
    description:
      "Mark all articles as read. Optionally filter by feed or folder. Ask for confirmation first.",
    parameters: z.object({
      feed_id: z
        .string()
        .optional()
        .describe("Only mark articles from this feed."),
      folder_id: z
        .string()
        .optional()
        .describe("Only mark articles from this folder."),
    }),
    annotations: WRITE_IDEMPOTENT,
    invocationText: {
      invoking: "Updating articles…",
      invoked: "All marked as read",
    },
  },

  // --- Saving (4) ---
  {
    name: "save_article",
    title: "Save article",
    description: "Save an article for later reading.",
    parameters: z.object({
      article_id: z.string().describe("The article ID to save."),
    }),
    annotations: WRITE_IDEMPOTENT,
    invocationText: { invoking: "Saving article…", invoked: "Article saved" },
  },
  {
    name: "unsave_article",
    title: "Unsave article",
    description: "Remove an article from saved items.",
    parameters: z.object({
      article_id: z.string().describe("The article ID to unsave."),
    }),
    annotations: WRITE_IDEMPOTENT,
    invocationText: {
      invoking: "Removing from saved…",
      invoked: "Article unsaved",
    },
  },
  {
    name: "save_url",
    title: "Save URL",
    description: "Save an external URL for later reading.",
    parameters: z.object({
      url: z.string().url().describe("The URL to save."),
    }),
    annotations: WRITE,
    invocationText: { invoking: "Saving URL…", invoked: "URL saved" },
  },
  {
    name: "get_saved",
    title: "List saved articles",
    description:
      "List saved articles. Supports pagination, search, date filtering, and sorting.",
    parameters: z.object({
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Max articles to return (1–100)."),
      before_published_at: z
        .string()
        .optional()
        .describe("Keyset cursor: ISO-8601 published_at."),
      before_id: z
        .string()
        .optional()
        .describe("Keyset cursor: ID of the last article."),
      query: z.string().optional().describe("Full-text search query."),
      date_from: z
        .string()
        .optional()
        .describe("Filter: earliest date (ISO-8601)."),
      date_to: z
        .string()
        .optional()
        .describe("Filter: latest date (ISO-8601)."),
      sort: z.enum(["newest", "oldest"]).optional().describe("Sort order."),
    }),
    annotations: READ_ONLY,
    invocationText: {
      invoking: "Fetching saved articles…",
      invoked: "Saved articles loaded",
    },
  },

  // --- Feeds (3) ---
  {
    name: "get_feeds",
    title: "List feeds",
    description:
      "List subscribed feeds with unread counts. Use query to search by name. " +
      "Optionally filter by folder.",
    parameters: z.object({
      folder_id: z.string().optional().describe("Only feeds in this folder."),
      query: z.string().optional().describe("Search feeds by name."),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Max feeds to return (1–100)."),
      before_name: z
        .string()
        .optional()
        .describe("Keyset cursor: name of the last feed."),
      before_id: z
        .string()
        .optional()
        .describe("Keyset cursor: ID of the last feed."),
    }),
    annotations: READ_ONLY,
    invocationText: { invoking: "Fetching feeds…", invoked: "Feeds loaded" },
  },
  {
    name: "get_folders",
    title: "List folders",
    description: "List all feed folders with the number of feeds in each.",
    parameters: z.object({}),
    annotations: READ_ONLY,
    invocationText: {
      invoking: "Fetching folders…",
      invoked: "Folders loaded",
    },
  },
  {
    name: "get_tags",
    title: "List tags",
    description: "List all user-defined tags with article counts.",
    parameters: z.object({}),
    annotations: READ_ONLY,
    invocationText: { invoking: "Fetching tags…", invoked: "Tags loaded" },
  },

  // --- Tagging (3) ---
  {
    name: "create_tag",
    title: "Create tag",
    description: "Create a new tag for categorizing articles.",
    parameters: z.object({
      name: z.string().describe("Tag name."),
      color: z.string().optional().describe("Tag color (hex, e.g. '#ff0000')."),
    }),
    annotations: WRITE,
    invocationText: { invoking: "Creating tag…", invoked: "Tag created" },
  },
  {
    name: "delete_tag",
    title: "Delete tag",
    description: "Delete a user-created tag by ID.",
    parameters: z.object({
      tag_id: z.string().describe("The tag ID to delete."),
    }),
    annotations: DESTRUCTIVE_IDEMPOTENT,
    invocationText: { invoking: "Deleting tag…", invoked: "Tag deleted" },
  },
  {
    name: "tag_article",
    title: "Tag article",
    description: "Add or remove a tag on an article.",
    parameters: z.object({
      article_id: z.string().describe("The article ID."),
      tag_id: z.string().describe("The tag ID."),
      action: z
        .enum(["add", "remove"])
        .describe("Whether to add or remove the tag."),
    }),
    annotations: WRITE_IDEMPOTENT,
    invocationText: { invoking: "Updating tags…", invoked: "Tags updated" },
  },

  // --- Highlights (3) ---
  {
    name: "get_highlights",
    title: "Get highlights",
    description: "Get all text highlights from an article.",
    parameters: z.object({
      article_id: z.string().describe("The article ID."),
    }),
    annotations: READ_ONLY,
    invocationText: {
      invoking: "Fetching highlights…",
      invoked: "Highlights loaded",
    },
  },
  {
    name: "add_highlight",
    title: "Highlight passage",
    description:
      "Highlight a text passage in an article. The text must exist exactly in the article content.",
    parameters: z.object({
      article_id: z.string().describe("The article ID."),
      text: z.string().describe("The text passage to highlight."),
      color: z
        .string()
        .optional()
        .describe("Highlight color (e.g. 'yellow', 'blue')."),
    }),
    annotations: WRITE_IDEMPOTENT,
    invocationText: {
      invoking: "Adding highlight…",
      invoked: "Highlight added",
    },
  },
  {
    name: "remove_highlight",
    title: "Remove highlight",
    description: "Remove a highlight from an article.",
    parameters: z.object({
      article_id: z.string().describe("The article ID."),
      highlight_id: z.string().describe("The highlight ID to remove."),
    }),
    annotations: DESTRUCTIVE_IDEMPOTENT,
    invocationText: {
      invoking: "Removing highlight…",
      invoked: "Highlight removed",
    },
  },

  // --- Notes (3) ---
  {
    name: "get_notes",
    title: "Get note",
    description: "Get the note on an article.",
    parameters: z.object({
      article_id: z.string().describe("The article ID."),
    }),
    annotations: READ_ONLY,
    invocationText: { invoking: "Fetching note…", invoked: "Note loaded" },
  },
  {
    name: "add_note",
    title: "Add note",
    description: "Add or update a note on an article.",
    parameters: z.object({
      article_id: z.string().describe("The article ID."),
      content: z.string().describe("Note content (text or HTML)."),
    }),
    annotations: WRITE_IDEMPOTENT,
    invocationText: { invoking: "Saving note…", invoked: "Note saved" },
  },
  {
    name: "delete_note",
    title: "Delete note",
    description: "Delete a note from an article.",
    parameters: z.object({
      article_id: z.string().describe("The article ID."),
    }),
    annotations: DESTRUCTIVE_IDEMPOTENT,
    invocationText: { invoking: "Deleting note…", invoked: "Note deleted" },
  },

  // --- History (1) ---
  {
    name: "get_recently_read",
    title: "Recently read",
    description:
      "Get recently read articles ordered by when they were opened. Supports pagination and date filtering.",
    parameters: recentlyReadParams,
    annotations: READ_ONLY,
    invocationText: {
      invoking: "Fetching history…",
      invoked: "History loaded",
    },
  },

  // --- Output Feeds (1) ---
  {
    name: "get_output_feeds",
    title: "List output feeds",
    description: "List public RSS output feeds created by the user.",
    parameters: z.object({}),
    annotations: READ_ONLY,
    invocationText: {
      invoking: "Fetching output feeds…",
      invoked: "Output feeds loaded",
    },
  },

  // --- AI (1) ---
  {
    name: "text_to_speech",
    title: "Listen to article",
    description:
      "Generate audio from an article using text-to-speech. Returns the audio URL and duration.",
    parameters: z.object({
      article_id: z.string().describe("The article ID to convert to audio."),
    }),
    annotations: WRITE_IDEMPOTENT,
    invocationText: { invoking: "Generating audio…", invoked: "Audio ready" },
  },

  // --- Stats (1) ---
  {
    name: "get_stats",
    title: "Reading statistics",
    description:
      "Get reading statistics: streak, articles read today, reading time, total feeds, unread count, and saved count.",
    parameters: z.object({}),
    annotations: READ_ONLY,
    invocationText: { invoking: "Fetching stats…", invoked: "Stats loaded" },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Look up a tool definition by name. */
export function getToolByName(name: string): ToolDefinition | undefined {
  return tools.find((t) => t.name === name);
}

/**
 * Convert a tool's Zod schema to JSON Schema.
 *
 * @param target - JSON Schema draft version. Defaults to `"draft-07"` for
 *   broad compatibility (Ajv, TypeBox, OpenClaw). Use `"draft-2020-12"` if
 *   the consumer supports it.
 */
export function toJsonSchema(
  toolName: string,
  target: "draft-07" | "draft-2020-12" = "draft-07"
): Record<string, unknown> {
  const tool = getToolByName(toolName);
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }
  return z.toJSONSchema(tool.parameters, { target }) as Record<string, unknown>;
}
