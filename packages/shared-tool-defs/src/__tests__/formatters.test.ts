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
import { describe, expect, it } from "vitest";
import {
  formatArticleDetail,
  formatArticleList,
  formatEmpty,
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
} from "../formatters";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const article: ArticleV1 = {
  id: "a1",
  title: "Building with Next.js",
  source: "Vercel Blog",
  url: "https://vercel.com/blog/nextjs",
  published_at: new Date(Date.now() - 3_600_000).toISOString(),
  summary_preview: "A guide to building...",
  image_url: null,
  is_read: false,
  is_saved: false,
  tags: ["dev", "react"],
  highlights_count: 2,
  notes_count: 1,
};

const articleDetail: ArticleDetailV1 = {
  ...article,
  content: "<p>Next.js is a <strong>React</strong> framework.</p>",
  full_content: null,
  highlights: [
    {
      id: "h1",
      text: "React framework",
      color: "yellow",
      start_position: null,
      end_position: null,
    },
  ],
  note: {
    id: "n1",
    article_id: "a1",
    content: "<p>Important for project.</p>",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_notes_count: 1,
  },
  author: "Lee Robinson",
  reading_time_seconds: 300,
};

const feed: FeedV1 = {
  id: "f1",
  name: "Vercel Blog",
  url: "https://vercel.com/feed",
  description: "Updates from Vercel",
  image: null,
  category: null,
  unread_count: 5,
  folder_ids: ["folder-1"],
};

const folder: FolderV1 = {
  id: "folder-1",
  name: "Tech",
  color: "#0070f3",
  feed_count: 12,
};

const tag: TagV1 = {
  id: "t1",
  name: "AI",
  color: "#ff0000",
  article_count: 42,
};

const highlight: HighlightV1 = {
  id: "h1",
  text: "This is important",
  color: "yellow",
  start_position: 10,
  end_position: 27,
};

const note: NoteV1 = {
  id: "n1",
  article_id: "a1",
  content:
    "<h2>Key Points</h2><ul><li>Server components</li><li>Edge runtime</li></ul>",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  total_notes_count: 1,
};

const savedArticle: SavedArticleV1 = {
  id: "s1",
  title: "How to learn Rust",
  url: "https://example.com/rust",
  source: "Dev.to",
  published_at: new Date().toISOString(),
  saved_at: new Date(Date.now() - 7_200_000).toISOString(),
  is_read: false,
  tags: [],
  has_highlights: false,
  has_notes: false,
};

const recentlyRead: RecentlyReadV1 = {
  ...article,
  is_read: true,
  opened_at: new Date(Date.now() - 1_800_000).toISOString(),
  reading_time_seconds: 180,
};

const outputFeed: OutputFeedV1 = {
  id: "of1",
  title: "My AI Feed",
  slug: "my-ai-feed",
  public_url: "https://feednest.com/feeds/my-ai-feed.xml",
  source_type: "tag",
  source_id: "t1",
  created_at: new Date().toISOString(),
};

const stats: StatsV1 = {
  articles_read_today: 5,
  reading_time_today_minutes: 30,
  streak_days: 7,
  total_feeds: 20,
  unread_count: 42,
  saved_count: 10,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("formatArticleList", () => {
  it("formats articles with title, source, relative date, id, and summary", () => {
    const result = formatArticleList([article]);
    expect(result).toContain("Building with Next.js");
    expect(result).toContain("Vercel Blog");
    expect(result).toContain("1h ago");
    expect(result).toContain("2 highlights");
    expect(result).toContain("tags: dev, react");
    expect(result).toContain("id: a1");
    expect(result).toContain("A guide to building...");
  });

  it("returns empty message for empty list", () => {
    expect(formatArticleList([])).toBe("No articles found.");
  });
});

describe("formatArticleDetail", () => {
  it("includes id, title, author, date, content, highlights with ids, and notes", () => {
    const result = formatArticleDetail(articleDetail);
    expect(result).toContain("# Building with Next.js");
    expect(result).toContain("ID: a1");
    expect(result).toContain("By Lee Robinson");
    expect(result).toContain("Source: Vercel Blog");
    expect(result).toContain("5 min read");
    expect(result).toContain("Next.js is a React framework.");
    expect(result).toContain("## Highlights");
    expect(result).toContain('[yellow] "React framework" (highlight_id: h1)');
    expect(result).toContain("## Note");
    expect(result).toContain("Important for project.");
  });
});

describe("formatFeedList", () => {
  it("formats feeds with name, url, unread count, and id", () => {
    const result = formatFeedList([feed]);
    expect(result).toContain("Vercel Blog");
    expect(result).toContain("5 unread");
    expect(result).toContain("https://vercel.com/feed");
    expect(result).toContain("id: f1");
  });

  it("returns empty message for empty list", () => {
    expect(formatFeedList([])).toBe("No feeds found.");
  });
});

describe("formatFolderList", () => {
  it("formats folders with name, feed count, and id", () => {
    const result = formatFolderList([folder]);
    expect(result).toContain("Tech");
    expect(result).toContain("12 feeds");
    expect(result).toContain("id: folder-1");
  });

  it("returns empty message for empty list", () => {
    expect(formatFolderList([])).toBe("No folders found.");
  });
});

describe("formatTagList", () => {
  it("formats tags with name, article count, and id", () => {
    const result = formatTagList([tag]);
    expect(result).toContain("AI");
    expect(result).toContain("42 articles");
    expect(result).toContain("id: t1");
  });

  it("returns empty message for empty list", () => {
    expect(formatTagList([])).toBe("No tags found.");
  });
});

describe("formatRecentlyReadList", () => {
  it("formats with title, source, opened_at relative time, reading_time, and id", () => {
    const result = formatRecentlyReadList([recentlyRead]);
    expect(result).toContain("Building with Next.js");
    expect(result).toContain("Vercel Blog");
    expect(result).toContain("opened 30m ago");
    expect(result).toContain("3 min read");
    expect(result).toContain("id: a1");
  });

  it("returns empty message for empty list", () => {
    expect(formatRecentlyReadList([])).toBe("No recently read articles found.");
  });
});

describe("formatOutputFeedList", () => {
  it("formats with title, public_url, source_type, and id", () => {
    const result = formatOutputFeedList([outputFeed]);
    expect(result).toContain("My AI Feed");
    expect(result).toContain("[tag]");
    expect(result).toContain("https://feednest.com/feeds/my-ai-feed.xml");
    expect(result).toContain("id: of1");
  });

  it("returns empty message for empty list", () => {
    expect(formatOutputFeedList([])).toBe("No output feeds found.");
  });
});

describe("formatStats", () => {
  it("formats streak, articles read, reading time, and counts", () => {
    const result = formatStats(stats);
    expect(result).toContain("Articles read today: 5");
    expect(result).toContain("Reading time today: 30 min");
    expect(result).toContain("Streak: 7 days");
    expect(result).toContain("Total feeds: 20");
    expect(result).toContain("Unread: 42");
    expect(result).toContain("Saved: 10");
  });
});

describe("formatHighlightList", () => {
  it("formats highlighted passages with color and id", () => {
    const result = formatHighlightList([highlight]);
    expect(result).toContain("[yellow]");
    expect(result).toContain('"This is important"');
    expect(result).toContain("highlight_id: h1");
  });

  it("returns empty message for empty list", () => {
    expect(formatHighlightList([])).toBe("No highlights found.");
  });
});

describe("formatNoteDetail", () => {
  it("converts HTML Tiptap content to readable text and includes note id", () => {
    const result = formatNoteDetail(note);
    expect(result).toContain("note_id: n1");
    expect(result).toContain("Key Points");
    expect(result).toContain("• Server components");
    expect(result).toContain("• Edge runtime");
    expect(result).not.toContain("<h2>");
    expect(result).not.toContain("<ul>");
    expect(result).not.toContain("<li>");
  });
});

describe("formatSavedList", () => {
  it("formats with title, url, saved date, and id", () => {
    const result = formatSavedList([savedArticle]);
    expect(result).toContain("How to learn Rust");
    expect(result).toContain("https://example.com/rust");
    expect(result).toContain("saved 2h ago");
    expect(result).toContain("id: s1");
  });

  it("returns empty message for empty list", () => {
    expect(formatSavedList([])).toBe("No saved articles found.");
  });
});

describe("formatError", () => {
  it("maps error codes to user-friendly messages when no custom message", () => {
    expect(formatError({ code: "UNAUTHORIZED" })).toContain("API key");
    expect(formatError({ code: "SUBSCRIPTION_REQUIRED" })).toContain("Pro");
    expect(formatError({ code: "RATE_LIMITED" })).toContain("wait");
    expect(formatError({ code: "NOT_FOUND" })).toContain("not found");
    expect(formatError({ code: "TIMEOUT" })).toContain("timed out");
    expect(formatError({ code: "NETWORK_ERROR" })).toContain("connect");
    expect(formatError({ code: "INTERNAL_ERROR" })).toContain(
      "wrong on the server"
    );
  });

  it("prefers custom message over generic when both are provided", () => {
    expect(
      formatError({ code: "FORBIDDEN", message: "Not enough AI tokens." })
    ).toBe("Not enough AI tokens.");
    expect(
      formatError({ code: "NOT_FOUND", message: "Article not found." })
    ).toBe("Article not found.");
  });

  it("falls back to message when code is unknown", () => {
    expect(formatError({ message: "Custom error" })).toBe("Custom error");
  });

  it("returns generic message when no code or message", () => {
    expect(formatError({})).toBe("An unexpected error occurred.");
  });
});

describe("formatEmpty", () => {
  it("returns contextualized message for each resource type", () => {
    expect(formatEmpty("articles")).toBe("No articles found.");
    expect(formatEmpty("feeds")).toBe("No feeds found.");
    expect(formatEmpty("folders")).toBe("No folders found.");
    expect(formatEmpty("tags")).toBe("No tags found.");
    expect(formatEmpty("highlights")).toBe("No highlights found.");
    expect(formatEmpty("saved articles")).toBe("No saved articles found.");
    expect(formatEmpty("recently read articles")).toBe(
      "No recently read articles found."
    );
    expect(formatEmpty("output feeds")).toBe("No output feeds found.");
    expect(formatEmpty("notes")).toBe("No notes found.");
  });
});
