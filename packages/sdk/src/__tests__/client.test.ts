import { afterEach, describe, expect, it, vi } from "vitest";
import { FeedNestClient } from "../client";
import { FeedNestError } from "../errors";

// ---------------------------------------------------------------------------
// Mock fetch
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

afterEach(() => {
  mockFetch.mockReset();
});

function jsonResponse(
  data: unknown,
  status = 200,
  headers?: Record<string, string>
) {
  return Promise.resolve(
    new Response(JSON.stringify(data), {
      status,
      statusText: status === 200 ? "OK" : "Error",
      headers: { "Content-Type": "application/json", ...headers },
    })
  );
}

function textResponse(text: string, status = 200) {
  return Promise.resolve(
    new Response(text, {
      status,
      statusText: "OK",
      headers: { "Content-Type": "application/xml" },
    })
  );
}

function errorResponse(
  status: number,
  error: { message: string; code?: string }
) {
  return Promise.resolve(
    new Response(JSON.stringify({ error }), {
      status,
      statusText: "Error",
      headers: { "Content-Type": "application/json" },
    })
  );
}

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------

describe("FeedNestClient constructor", () => {
  it("uses default baseUrl when not provided", () => {
    const client = new FeedNestClient({ apiKey: "fn_live_test123" });
    expect(client).toBeDefined();
  });

  it("accepts custom baseUrl", () => {
    const client = new FeedNestClient({
      apiKey: "fn_live_test123",
      baseUrl: "https://custom.example.com",
    });
    expect(client).toBeDefined();
  });

  it("throws FeedNestError if apiKey is empty", () => {
    expect(() => new FeedNestClient({ apiKey: "" })).toThrow(FeedNestError);
  });
});

// ---------------------------------------------------------------------------
// _request internals
// ---------------------------------------------------------------------------

describe("_request", () => {
  const client = new FeedNestClient({ apiKey: "fn_live_test123" });

  it("sends correct Authorization Bearer header", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: [], meta: { has_more: false } })
    );

    await client.getNewsfeedArticles();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer fn_live_test123");
  });

  it("sends User-Agent header with SDK version", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: [], meta: { has_more: false } })
    );

    await client.getNewsfeedArticles();

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers["User-Agent"]).toMatch(
      /^@feednest\/sdk\/\d+\.\d+\.\d+/
    );
  });

  it("sends Content-Type header when body is provided", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ success: true }));

    await client.markAllAsRead({ feedId: "feed-1" });

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers["Content-Type"]).toBe("application/json");
  });

  it("does not send Content-Type for GET requests", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: [], meta: { has_more: false } })
    );

    await client.getNewsfeedArticles();

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers["Content-Type"]).toBeUndefined();
  });

  it("respects timeout with AbortController", async () => {
    const slowClient = new FeedNestClient({
      apiKey: "fn_live_test123",
      timeout: 50,
    });

    mockFetch.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 200))
    );

    const error = await slowClient
      .getNewsfeedArticles()
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(FeedNestError);
    expect((error as FeedNestError).code).toBe("TIMEOUT");
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe("error handling", () => {
  const client = new FeedNestClient({ apiKey: "fn_live_test123" });

  it("401 → throws FeedNestError with code UNAUTHORIZED", async () => {
    mockFetch.mockReturnValueOnce(
      errorResponse(401, { message: "Invalid API key" })
    );

    try {
      await client.getNewsfeedArticles();
      expect.fail("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(FeedNestError);
      expect((e as FeedNestError).code).toBe("UNAUTHORIZED");
      expect((e as FeedNestError).status).toBe(401);
    }
  });

  it("403 FORBIDDEN → throws FeedNestError with code FORBIDDEN", async () => {
    mockFetch.mockReturnValueOnce(
      errorResponse(403, { message: "Insufficient scope", code: "FORBIDDEN" })
    );

    try {
      await client.markAsRead("article-1");
      expect.fail("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(FeedNestError);
      expect((e as FeedNestError).code).toBe("FORBIDDEN");
    }
  });

  it("403 SUBSCRIPTION_REQUIRED → throws FeedNestError with code SUBSCRIPTION_REQUIRED", async () => {
    mockFetch.mockReturnValueOnce(
      errorResponse(403, {
        message: "Pro subscription required",
        code: "SUBSCRIPTION_REQUIRED",
      })
    );

    try {
      await client.getNewsfeedArticles();
      expect.fail("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(FeedNestError);
      expect((e as FeedNestError).code).toBe("SUBSCRIPTION_REQUIRED");
    }
  });

  it("404 → throws FeedNestError with code NOT_FOUND", async () => {
    mockFetch.mockReturnValueOnce(
      errorResponse(404, { message: "Article not found" })
    );

    try {
      await client.getArticle("nonexistent");
      expect.fail("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(FeedNestError);
      expect((e as FeedNestError).code).toBe("NOT_FOUND");
    }
  });

  it("429 → throws FeedNestError with code RATE_LIMITED and retryAfter", async () => {
    mockFetch.mockReturnValueOnce(
      Promise.resolve(
        new Response(
          JSON.stringify({ error: { message: "Rate limit exceeded" } }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": "60",
            },
          }
        )
      )
    );

    try {
      await client.getNewsfeedArticles();
      expect.fail("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(FeedNestError);
      expect((e as FeedNestError).code).toBe("RATE_LIMITED");
      expect((e as FeedNestError).retryAfter).toBe(60);
    }
  });

  it("500 → throws FeedNestError with code INTERNAL_ERROR", async () => {
    mockFetch.mockReturnValueOnce(
      errorResponse(500, { message: "Internal server error" })
    );

    try {
      await client.getNewsfeedArticles();
      expect.fail("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(FeedNestError);
      expect((e as FeedNestError).code).toBe("INTERNAL_ERROR");
    }
  });

  it("network error → throws FeedNestError with code NETWORK_ERROR", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("fetch failed"));

    try {
      await client.getNewsfeedArticles();
      expect.fail("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(FeedNestError);
      expect((e as FeedNestError).code).toBe("NETWORK_ERROR");
    }
  });

  it("non-JSON response → throws FeedNestError with code PARSE_ERROR", async () => {
    mockFetch.mockReturnValueOnce(
      Promise.resolve(
        new Response("this is not json", {
          status: 200,
          headers: { "Content-Type": "text/html" },
        })
      )
    );

    try {
      await client.getNewsfeedArticles();
      expect.fail("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(FeedNestError);
      expect((e as FeedNestError).code).toBe("PARSE_ERROR");
    }
  });
});

// ---------------------------------------------------------------------------
// Articles — Lists
// ---------------------------------------------------------------------------

describe("article list methods", () => {
  const client = new FeedNestClient({ apiKey: "fn_live_test123" });

  it("getNewsfeedArticles() calls GET /api/v1/articles", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: [{ id: "a1" }], meta: { has_more: true } })
    );

    const result = await client.getNewsfeedArticles();

    expect(mockFetch.mock.calls[0][0]).toBe(
      "https://feednest.com/api/v1/articles"
    );
    expect(result.data).toHaveLength(1);
    expect(result.hasMore).toBe(true);
  });

  it("getNewsfeedArticles({ unreadOnly: true }) passes ?unread_only=true", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: [], meta: { has_more: false } })
    );

    await client.getNewsfeedArticles({ unreadOnly: true });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("unread_only=true");
  });

  it("getNewsfeedArticles with keyset pagination passes before_published_at and before_id", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: [], meta: { has_more: false } })
    );

    await client.getNewsfeedArticles({
      beforePublishedAt: "2026-02-20T00:00:00Z",
      beforeId: "abc-123",
    });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("before_published_at=");
    expect(url).toContain("before_id=abc-123");
  });

  it("getNewsfeedArticles with search and date filters", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: [], meta: { has_more: false } })
    );

    await client.getNewsfeedArticles({
      query: "React",
      dateFrom: "2026-02-01",
      dateTo: "2026-02-28",
      sort: "oldest",
    });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("q=React");
    expect(url).toContain("date_from=2026-02-01");
    expect(url).toContain("date_to=2026-02-28");
    expect(url).toContain("sort=oldest");
  });

  it("getArticlesByFeed calls GET /api/v1/articles/by-feed/{feedId}", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: [], meta: { has_more: false } })
    );

    await client.getArticlesByFeed("feed-1");

    expect(mockFetch.mock.calls[0][0]).toContain(
      "/api/v1/articles/by-feed/feed-1"
    );
  });

  it("getArticlesByFolder calls GET /api/v1/articles/by-folder/{folderId}", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: [], meta: { has_more: false } })
    );

    await client.getArticlesByFolder("folder-1");

    expect(mockFetch.mock.calls[0][0]).toContain(
      "/api/v1/articles/by-folder/folder-1"
    );
  });

  it("getArticlesByTag calls GET /api/v1/articles/by-tag/{tagId}", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: [], meta: { has_more: false } })
    );

    await client.getArticlesByTag("tag-1");

    expect(mockFetch.mock.calls[0][0]).toContain(
      "/api/v1/articles/by-tag/tag-1"
    );
  });

  it("getArticlesWithTags calls GET /api/v1/articles/tagged", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: [], meta: { has_more: false } })
    );

    await client.getArticlesWithTags();

    expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/articles/tagged");
  });

  it("getArticlesWithHighlights calls GET /api/v1/articles/highlighted", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: [], meta: { has_more: false } })
    );

    await client.getArticlesWithHighlights();

    expect(mockFetch.mock.calls[0][0]).toContain(
      "/api/v1/articles/highlighted"
    );
  });

  it("getArticlesWithNotes calls GET /api/v1/articles/noted", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: [], meta: { has_more: false } })
    );

    await client.getArticlesWithNotes();

    expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/articles/noted");
  });

  it("getRecentlyRead calls GET /api/v1/articles/recently-read", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: [], meta: { has_more: false } })
    );

    await client.getRecentlyRead();

    expect(mockFetch.mock.calls[0][0]).toContain(
      "/api/v1/articles/recently-read"
    );
  });

  it("getRecentlyRead with keyset pagination uses before_opened_at", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: [], meta: { has_more: false } })
    );

    await client.getRecentlyRead({
      beforeOpenedAt: "2026-02-20T12:00:00Z",
      beforeId: "id-1",
    });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("before_opened_at=");
    expect(url).toContain("before_id=id-1");
  });

  it("getRecentlyRead with since and dateTo for range queries", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: [], meta: { has_more: false } })
    );

    await client.getRecentlyRead({
      since: "2026-02-16",
      dateTo: "2026-02-18",
    });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("since=2026-02-16");
    expect(url).toContain("date_to=2026-02-18");
  });
});

// ---------------------------------------------------------------------------
// Articles — Single
// ---------------------------------------------------------------------------

describe("article single methods", () => {
  const client = new FeedNestClient({ apiKey: "fn_live_test123" });

  it("getArticle calls GET /api/v1/articles/{id}", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: { id: "a1", title: "Test", content: "..." } })
    );

    const article = await client.getArticle("a1");

    expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/articles/a1");
    expect(mockFetch.mock.calls[0][1].method).toBe("GET");
    expect(article.id).toBe("a1");
  });

  it("extractArticle calls POST /api/v1/articles/{id}/extract", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({
        data: { id: "a1", title: "Test", full_content: "Full..." },
      })
    );

    const article = await client.extractArticle("a1");

    expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/articles/a1/extract");
    expect(mockFetch.mock.calls[0][1].method).toBe("POST");
    expect(article.id).toBe("a1");
  });
});

// ---------------------------------------------------------------------------
// Articles — Actions
// ---------------------------------------------------------------------------

describe("article action methods", () => {
  const client = new FeedNestClient({ apiKey: "fn_live_test123" });

  it("markAsRead calls POST /api/v1/articles/{id}/read", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ success: true }));

    await client.markAsRead("a1");

    expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/articles/a1/read");
    expect(mockFetch.mock.calls[0][1].method).toBe("POST");
  });

  it("markAsUnread calls POST /api/v1/articles/{id}/unread", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ success: true }));

    await client.markAsUnread("a1");

    expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/articles/a1/unread");
    expect(mockFetch.mock.calls[0][1].method).toBe("POST");
  });

  it("markAllAsRead calls POST /api/v1/articles/mark-all-read", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ success: true }));

    await client.markAllAsRead();

    expect(mockFetch.mock.calls[0][0]).toContain(
      "/api/v1/articles/mark-all-read"
    );
  });

  it("markAllAsRead with feedId passes feed_id in body", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ success: true }));

    await client.markAllAsRead({ feedId: "feed-1" });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.feed_id).toBe("feed-1");
  });
});

// ---------------------------------------------------------------------------
// Saving
// ---------------------------------------------------------------------------

describe("saving methods", () => {
  const client = new FeedNestClient({ apiKey: "fn_live_test123" });

  it("saveArticle calls POST /api/v1/articles/{id}/save", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ success: true }));

    await client.saveArticle("a1");

    expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/articles/a1/save");
    expect(mockFetch.mock.calls[0][1].method).toBe("POST");
  });

  it("unsaveArticle calls DELETE /api/v1/articles/{id}/save", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ success: true }));

    await client.unsaveArticle("a1");

    expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/articles/a1/save");
    expect(mockFetch.mock.calls[0][1].method).toBe("DELETE");
  });

  it("saveUrl calls POST /api/v1/saved/url", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: { id: "saved-1", url: "https://example.com" } })
    );

    const saved = await client.saveUrl("https://example.com");

    expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/saved/url");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.url).toBe("https://example.com");
    expect(saved.id).toBe("saved-1");
  });

  it("getSavedArticles calls GET /api/v1/saved", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: [], meta: { has_more: false } })
    );

    await client.getSavedArticles();

    expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/saved");
  });

  it("getSavedArticles with keyset pagination", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: [], meta: { has_more: false } })
    );

    await client.getSavedArticles({
      beforePublishedAt: "2026-02-20T00:00:00Z",
      beforeId: "id-1",
    });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("before_published_at=");
    expect(url).toContain("before_id=id-1");
  });

  it("getSavedArticles with search query", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: [], meta: { has_more: false } })
    );

    await client.getSavedArticles({ query: "React" });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("q=React");
  });

  it("getSavedArticles with date range and sort", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: [], meta: { has_more: false } })
    );

    await client.getSavedArticles({
      dateFrom: "2026-01-01",
      dateTo: "2026-02-28",
      sort: "oldest",
    });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("date_from=2026-01-01");
    expect(url).toContain("date_to=2026-02-28");
    expect(url).toContain("sort=oldest");
  });
});

// ---------------------------------------------------------------------------
// Highlights
// ---------------------------------------------------------------------------

describe("highlight methods", () => {
  const client = new FeedNestClient({ apiKey: "fn_live_test123" });

  it("getHighlights calls GET /api/v1/articles/{id}/highlights", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ data: [] }));

    await client.getHighlights("a1");

    expect(mockFetch.mock.calls[0][0]).toContain(
      "/api/v1/articles/a1/highlights"
    );
  });

  it("addHighlight calls POST with text", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: { id: "h1", text: "important", color: "yellow" } })
    );

    const h = await client.addHighlight("a1", "important");

    expect(mockFetch.mock.calls[0][1].method).toBe("POST");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).toBe("important");
    expect(h.text).toBe("important");
  });

  it("addHighlight passes optional color", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: { id: "h1", text: "important", color: "blue" } })
    );

    await client.addHighlight("a1", "important", "blue");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.color).toBe("blue");
  });

  it("removeHighlight calls DELETE /api/v1/articles/{id}/highlights/{hId}", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ success: true }));

    await client.removeHighlight("a1", "h1");

    expect(mockFetch.mock.calls[0][0]).toContain(
      "/api/v1/articles/a1/highlights/h1"
    );
    expect(mockFetch.mock.calls[0][1].method).toBe("DELETE");
  });
});

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

describe("note methods", () => {
  const client = new FeedNestClient({ apiKey: "fn_live_test123" });

  it("getNotes calls GET /api/v1/articles/{id}/notes", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: { id: "n1", content: "Note" } })
    );

    const note = await client.getNotes("a1");

    expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/articles/a1/notes");
    expect(note.id).toBe("n1");
  });

  it("addNote calls POST with content", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: { id: "n1", content: "My note" } })
    );

    await client.addNote("a1", "My note");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.content).toBe("My note");
  });

  it("deleteNote calls DELETE /api/v1/articles/{id}/notes", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ success: true }));

    await client.deleteNote("a1");

    expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/articles/a1/notes");
    expect(mockFetch.mock.calls[0][1].method).toBe("DELETE");
  });
});

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

describe("tag methods", () => {
  const client = new FeedNestClient({ apiKey: "fn_live_test123" });

  it("getTags calls GET /api/v1/tags", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ data: [] }));

    await client.getTags();

    expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/tags");
  });

  it("createTag calls POST /api/v1/tags with name", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: { id: "t1", name: "AI" } })
    );

    const tag = await client.createTag("AI");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.name).toBe("AI");
    expect(tag.name).toBe("AI");
  });

  it("createTag passes optional color", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: { id: "t1", name: "AI", color: "#ff0000" } })
    );

    await client.createTag("AI", "#ff0000");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.color).toBe("#ff0000");
  });

  it("tagArticle calls POST /api/v1/articles/{id}/tags with tag_id", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ success: true }));

    await client.tagArticle("a1", "t1");

    expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/articles/a1/tags");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.tag_id).toBe("t1");
  });

  it("untagArticle calls DELETE /api/v1/articles/{id}/tags/{tagId}", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ success: true }));

    await client.untagArticle("a1", "t1");

    expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/articles/a1/tags/t1");
    expect(mockFetch.mock.calls[0][1].method).toBe("DELETE");
  });
});

// ---------------------------------------------------------------------------
// Feeds, Folders, Output Feeds (read-only)
// ---------------------------------------------------------------------------

describe("structure methods (read-only)", () => {
  const client = new FeedNestClient({ apiKey: "fn_live_test123" });

  it("getFeeds calls GET /api/v1/feeds", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: [], meta: { has_more: false } })
    );

    await client.getFeeds();

    expect(mockFetch.mock.calls[0][0]).toBe(
      "https://feednest.com/api/v1/feeds"
    );
  });

  it("getFeeds with folderId passes ?folder_id=", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: [], meta: { has_more: false } })
    );

    await client.getFeeds({ folderId: "folder-1" });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("folder_id=folder-1");
  });

  it("getFeeds with keyset pagination passes before_name and before_id", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ data: [], meta: { has_more: false } })
    );

    await client.getFeeds({ beforeName: "Vercel", beforeId: "id-50" });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("before_name=Vercel");
    expect(url).toContain("before_id=id-50");
  });

  it("getFolders calls GET /api/v1/folders", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ data: [] }));

    await client.getFolders();

    expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/folders");
  });

  it("getOutputFeeds calls GET /api/v1/output-feeds", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ data: [] }));

    await client.getOutputFeeds();

    expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/output-feeds");
  });

  it("exportOpml calls GET /api/v1/feeds/export-opml and returns string", async () => {
    mockFetch.mockReturnValueOnce(
      textResponse('<?xml version="1.0"?><opml><body/></opml>')
    );

    const opml = await client.exportOpml();

    expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/feeds/export-opml");
    expect(opml).toContain("<opml>");
    expect(typeof opml).toBe("string");
  });
});

// ---------------------------------------------------------------------------
// AI
// ---------------------------------------------------------------------------

describe("AI methods", () => {
  const client = new FeedNestClient({ apiKey: "fn_live_test123" });

  it("textToSpeech calls POST /api/v1/ai/text-to-speech", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({
        data: {
          audio_url: "https://cdn.example.com/audio.mp3",
          duration_seconds: 120,
        },
      })
    );

    const result = await client.textToSpeech("a1");

    expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/ai/text-to-speech");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.article_id).toBe("a1");
    expect(result.audio_url).toContain("audio.mp3");
    expect(result.duration_seconds).toBe(120);
  });
});

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

describe("stats methods", () => {
  const client = new FeedNestClient({ apiKey: "fn_live_test123" });

  it("getStats calls GET /api/v1/stats", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({
        data: {
          articles_read_today: 5,
          reading_time_today_minutes: 30,
          streak_days: 7,
          total_feeds: 20,
          unread_count: 42,
          saved_count: 10,
        },
      })
    );

    const stats = await client.getStats();

    expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/stats");
    expect(stats.articles_read_today).toBe(5);
    expect(stats.streak_days).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// Response parsing
// ---------------------------------------------------------------------------

describe("response parsing", () => {
  const client = new FeedNestClient({ apiKey: "fn_live_test123" });

  it("parses ApiV1Response with has_more correctly", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({
        data: [{ id: "a1" }, { id: "a2" }],
        meta: { has_more: true },
      })
    );

    const result = await client.getNewsfeedArticles();

    expect(result.data).toHaveLength(2);
    expect(result.hasMore).toBe(true);
  });

  it("defaults hasMore to false when meta is missing", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ data: [] }));

    const result = await client.getNewsfeedArticles();

    expect(result.hasMore).toBe(false);
  });

  it("defaults hasMore to false when meta.has_more is missing", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ data: [], meta: {} }));

    const result = await client.getNewsfeedArticles();

    expect(result.hasMore).toBe(false);
  });
});
