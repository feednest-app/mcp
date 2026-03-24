/**
 * Human-readable text formatters for MCP tool responses.
 *
 * Each formatter converts structured V1 API data into concise text
 * that LLM agents can present to users or reason about.
 *
 * @module
 */

import type {
  ArticleDetailV1,
  ArticleV1,
  FeedV1,
  FolderV1,
  HighlightV1,
  NoteV1,
  OutputFeedV1,
  RecentlyReadV1,
  SavedArticleV1,
  StatsV1,
  TagV1,
} from "@feednest/sdk";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(iso: string | null): string {
  if (!iso) {
    return "unknown date";
  }
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) {
    return "just now";
  }
  if (mins < 60) {
    return `${mins}m ago`;
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}d ago`;
  }
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function readingTime(seconds: number | null): string {
  if (seconds == null || seconds <= 0) {
    return "";
  }
  const mins = Math.round(seconds / 60);
  return mins < 1 ? "<1 min read" : `${mins} min read`;
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

/** Format a list of articles as readable text. */
export function formatArticleList(articles: ArticleV1[]): string {
  if (articles.length === 0) {
    return formatEmpty("articles");
  }
  return articles
    .map((a, i) => {
      const status = a.is_read ? "✓" : "•";
      const title = a.title ?? "Untitled";
      const source = a.source ?? "Unknown source";
      const date = relativeTime(a.published_at);
      const annotations: string[] = [];
      if (a.highlights_count > 0) {
        annotations.push(`${a.highlights_count} highlights`);
      }
      if (a.notes_count > 0) {
        annotations.push(`${a.notes_count} notes`);
      }
      if (a.tags.length > 0) {
        annotations.push(`tags: ${a.tags.join(", ")}`);
      }
      const suffix =
        annotations.length > 0 ? ` [${annotations.join(" | ")}]` : "";
      const preview = a.summary_preview ? `\n   ${a.summary_preview}` : "";
      return `${i + 1}. ${status} ${title} — ${source} (${date})${suffix}\n   id: ${a.id}${preview}`;
    })
    .join("\n");
}

/** Format full article detail as readable text. */
export function formatArticleDetail(article: ArticleDetailV1): string {
  const lines: string[] = [];
  lines.push(`# ${article.title ?? "Untitled"}`);
  lines.push(`ID: ${article.id}`);
  if (article.author) {
    lines.push(`By ${article.author}`);
  }
  if (article.source) {
    lines.push(`Source: ${article.source}`);
  }
  lines.push(`Published: ${relativeTime(article.published_at)}`);
  const rt = readingTime(article.reading_time_seconds);
  if (rt) {
    lines.push(rt);
  }
  lines.push(`URL: ${article.url}`);
  lines.push("");

  const content = article.full_content ?? article.content;
  if (content) {
    lines.push(stripHtml(content));
  } else {
    lines.push("(No content available — try extract_article to load from URL)");
  }

  if (article.highlights.length > 0) {
    lines.push("");
    lines.push("## Highlights");
    for (const h of article.highlights) {
      lines.push(`- [${h.color}] "${h.text}" (highlight_id: ${h.id})`);
    }
  }

  if (article.note) {
    lines.push("");
    lines.push("## Note");
    lines.push(stripHtml(article.note.content));
  }

  return lines.join("\n");
}

/** Format a list of feeds. */
export function formatFeedList(feeds: FeedV1[]): string {
  if (feeds.length === 0) {
    return formatEmpty("feeds");
  }
  return feeds
    .map((f, i) => {
      const unread = f.unread_count > 0 ? ` (${f.unread_count} unread)` : "";
      return `${i + 1}. ${f.name}${unread} — ${f.url}\n   id: ${f.id}`;
    })
    .join("\n");
}

/** Format a list of folders. */
export function formatFolderList(folders: FolderV1[]): string {
  if (folders.length === 0) {
    return formatEmpty("folders");
  }
  return folders
    .map(
      (f, i) => `${i + 1}. ${f.name} (${f.feed_count} feeds)\n   id: ${f.id}`
    )
    .join("\n");
}

/** Format a list of tags. */
export function formatTagList(tags: TagV1[]): string {
  if (tags.length === 0) {
    return formatEmpty("tags");
  }
  return tags
    .map(
      (t, i) =>
        `${i + 1}. ${t.name} (${t.article_count} articles)\n   id: ${t.id}`
    )
    .join("\n");
}

/** Format reading statistics. */
export function formatStats(stats: StatsV1): string {
  const lines: string[] = [
    `Articles read today: ${stats.articles_read_today}`,
    `Reading time today: ${stats.reading_time_today_minutes} min`,
    `Streak: ${stats.streak_days} days`,
    `Total feeds: ${stats.total_feeds}`,
    `Unread: ${stats.unread_count}`,
    `Saved: ${stats.saved_count}`,
  ];
  return lines.join("\n");
}

/** Format a list of highlights. */
export function formatHighlightList(highlights: HighlightV1[]): string {
  if (highlights.length === 0) {
    return formatEmpty("highlights");
  }
  return highlights
    .map(
      (h, i) => `${i + 1}. [${h.color}] "${h.text}"\n   highlight_id: ${h.id}`
    )
    .join("\n");
}

/** Format a note detail (converts Tiptap HTML to readable text). */
export function formatNoteDetail(note: NoteV1): string {
  return `note_id: ${note.id}\n${stripHtml(note.content)}`;
}

/** Format a list of saved articles. */
export function formatSavedList(saved: SavedArticleV1[]): string {
  if (saved.length === 0) {
    return formatEmpty("saved articles");
  }
  return saved
    .map((s, i) => {
      const title = s.title ?? "Untitled";
      const date = relativeTime(s.saved_at);
      return `${i + 1}. ${title} — ${s.url} (saved ${date})\n   id: ${s.id}`;
    })
    .join("\n");
}

/** Format a list of recently read articles. */
export function formatRecentlyReadList(articles: RecentlyReadV1[]): string {
  if (articles.length === 0) {
    return formatEmpty("recently read articles");
  }
  return articles
    .map((a, i) => {
      const title = a.title ?? "Untitled";
      const source = a.source ?? "Unknown source";
      const opened = relativeTime(a.opened_at);
      const rt = readingTime(a.reading_time_seconds);
      const rtSuffix = rt ? ` | ${rt}` : "";
      return `${i + 1}. ${title} — ${source} (opened ${opened}${rtSuffix})\n   id: ${a.id}`;
    })
    .join("\n");
}

/** Format a list of output feeds. */
export function formatOutputFeedList(feeds: OutputFeedV1[]): string {
  if (feeds.length === 0) {
    return formatEmpty("output feeds");
  }
  return feeds
    .map(
      (f, i) =>
        `${i + 1}. ${f.title ?? "Untitled"} [${f.source_type}] — ${f.public_url}\n   id: ${f.id}`
    )
    .join("\n");
}

/** Format an error into a user-friendly message. */
export function formatError(error: {
  code?: string;
  message?: string;
}): string {
  const messages: Record<string, string> = {
    UNAUTHORIZED: "Authentication failed. Please check your API key.",
    FORBIDDEN: "You don't have permission to perform this action.",
    SUBSCRIPTION_REQUIRED: "This feature requires a FeedNest Pro subscription.",
    NOT_FOUND: "The requested resource was not found.",
    RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
    VALIDATION_ERROR: "Invalid input. Please check the parameters.",
    TIMEOUT: "The request timed out. Please try again.",
    NETWORK_ERROR:
      "Could not connect to FeedNest. Please check your connection.",
    PARSE_ERROR: "Received an unexpected response from the server.",
    INTERNAL_ERROR:
      "Something went wrong on the server. Please try again later.",
  };

  if (error.message) {
    return error.message;
  }
  if (error.code && error.code in messages) {
    return messages[error.code];
  }
  return "An unexpected error occurred.";
}

/** Format a contextual "empty result" message. */
export function formatEmpty(
  context:
    | "articles"
    | "feeds"
    | "folders"
    | "tags"
    | "highlights"
    | "saved articles"
    | "recently read articles"
    | "output feeds"
    | "notes"
): string {
  const labels: Record<string, string> = {
    articles: "No articles found.",
    feeds: "No feeds found.",
    folders: "No folders found.",
    tags: "No tags found.",
    highlights: "No highlights found.",
    "saved articles": "No saved articles found.",
    "recently read articles": "No recently read articles found.",
    "output feeds": "No output feeds found.",
    notes: "No notes found.",
  };
  return labels[context] ?? `No ${context} found.`;
}
