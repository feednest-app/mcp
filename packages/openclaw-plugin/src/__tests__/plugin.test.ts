import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { tools } from "@feednest/shared-tool-defs";
import { describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@feednest/sdk", () => {
  class MockFeedNestError extends Error {
    readonly code: string;
    readonly status: number | undefined;
    readonly retryAfter: number | undefined;
    constructor(
      message: string,
      code: string,
      opts?: { status?: number; retryAfter?: number }
    ) {
      super(message);
      this.name = "FeedNestError";
      this.code = code;
      this.status = opts?.status;
      this.retryAfter = opts?.retryAfter;
    }
  }

  const mockMethods = {
    getNewsfeedArticles: vi
      .fn()
      .mockResolvedValue({ data: [], hasMore: false }),
    getArticlesByFeed: vi.fn().mockResolvedValue({ data: [], hasMore: false }),
    getArticlesByFolder: vi
      .fn()
      .mockResolvedValue({ data: [], hasMore: false }),
    getArticlesByTag: vi.fn().mockResolvedValue({ data: [], hasMore: false }),
    getArticlesWithTags: vi
      .fn()
      .mockResolvedValue({ data: [], hasMore: false }),
    getArticlesWithHighlights: vi
      .fn()
      .mockResolvedValue({ data: [], hasMore: false }),
    getArticlesWithNotes: vi
      .fn()
      .mockResolvedValue({ data: [], hasMore: false }),
    getArticle: vi.fn().mockResolvedValue({
      id: "a1",
      title: "Test",
      source: "Blog",
      url: "https://example.com",
      published_at: null,
      summary_preview: null,
      image_url: null,
      is_read: false,
      is_saved: false,
      tags: [],
      highlights_count: 0,
      notes_count: 0,
      content: "Hello",
      full_content: null,
      highlights: [],
      note: null,
      author: null,
      reading_time_seconds: null,
    }),
    extractArticle: vi.fn().mockResolvedValue({
      id: "a1",
      title: "Test",
      source: "Blog",
      url: "https://example.com",
      published_at: null,
      summary_preview: null,
      image_url: null,
      is_read: false,
      is_saved: false,
      tags: [],
      highlights_count: 0,
      notes_count: 0,
      content: "Hello",
      full_content: "Full content",
      highlights: [],
      note: null,
      author: null,
      reading_time_seconds: null,
    }),
    markAsRead: vi.fn().mockResolvedValue(undefined),
    markAsUnread: vi.fn().mockResolvedValue(undefined),
    markAllAsRead: vi.fn().mockResolvedValue(undefined),
    saveArticle: vi.fn().mockResolvedValue(undefined),
    unsaveArticle: vi.fn().mockResolvedValue(undefined),
    saveUrl: vi.fn().mockResolvedValue({
      id: "a2",
      title: "Saved",
      url: "https://saved.com",
      source: null,
      published_at: null,
      saved_at: "2026-01-01T00:00:00Z",
      is_read: false,
      tags: [],
      has_highlights: false,
      has_notes: false,
    }),
    getSavedArticles: vi.fn().mockResolvedValue({ data: [], hasMore: false }),
    getFeeds: vi.fn().mockResolvedValue({ data: [], hasMore: false }),
    getFolders: vi.fn().mockResolvedValue([]),
    getTags: vi.fn().mockResolvedValue([]),
    createTag: vi.fn().mockResolvedValue({
      id: "t1",
      name: "AI",
      color: "#000",
      article_count: 0,
    }),
    tagArticle: vi.fn().mockResolvedValue(undefined),
    untagArticle: vi.fn().mockResolvedValue(undefined),
    getHighlights: vi.fn().mockResolvedValue([]),
    addHighlight: vi.fn().mockResolvedValue({
      id: "h1",
      text: "important",
      color: "yellow",
      start_position: null,
      end_position: null,
    }),
    removeHighlight: vi.fn().mockResolvedValue(undefined),
    getNotes: vi.fn().mockResolvedValue({
      id: "n1",
      article_id: "a1",
      content: "My note",
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
      total_notes_count: 1,
    }),
    addNote: vi.fn().mockResolvedValue({
      id: "n1",
      article_id: "a1",
      content: "Note",
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
      total_notes_count: 1,
    }),
    deleteNote: vi.fn().mockResolvedValue(undefined),
    getRecentlyRead: vi.fn().mockResolvedValue({ data: [], hasMore: false }),
    getOutputFeeds: vi.fn().mockResolvedValue([]),
    textToSpeech: vi.fn().mockResolvedValue({
      audio_url: "https://audio.com/a.mp3",
      duration_seconds: 120,
    }),
    getStats: vi.fn().mockResolvedValue({
      articles_read_today: 5,
      reading_time_today_minutes: 30,
      streak_days: 7,
      total_feeds: 10,
      unread_count: 42,
      saved_count: 3,
    }),
  };

  class MockFeedNestClient {
    constructor(_opts: { apiKey: string }) {
      Object.assign(this, mockMethods);
    }
  }

  return {
    FeedNestError: MockFeedNestError,
    FeedNestClient: MockFeedNestClient,
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type RegisteredTool = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (
    _id: string,
    params: Record<string, unknown>
  ) => Promise<{ content: Array<{ type: string; text: string }> }>;
  optional: boolean;
};

function createMockApi() {
  const registered: RegisteredTool[] = [];
  return {
    api: {
      config: { apiKey: "fn_live_test1234test1234test1234tt" },
      registerTool: (
        spec: Omit<RegisteredTool, "optional">,
        opts?: { optional: boolean }
      ) => {
        registered.push({ ...spec, optional: opts?.optional ?? false });
      },
    },
    registered,
  };
}

async function loadPlugin() {
  const mod = await import("../index");
  return mod.default;
}

function textOf(result: {
  content: Array<{ type: string; text: string }>;
}): string {
  return result.content[0].text;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("OpenClaw Plugin", () => {
  describe("initialization", () => {
    it("throws if apiKey is missing", async () => {
      const register = await loadPlugin();
      const api = {
        config: {},
        registerTool: vi.fn(),
      };
      expect(() => register(api as never)).toThrow("API key is required");
    });

    it("registers tools when apiKey is provided", async () => {
      const register = await loadPlugin();
      const { api, registered } = createMockApi();
      register(api as never);
      expect(registered.length).toBeGreaterThan(0);
    });
  });

  describe("tool registration", () => {
    it("registers exactly 26 tools", async () => {
      const register = await loadPlugin();
      const { api, registered } = createMockApi();
      register(api as never);
      expect(registered).toHaveLength(26);
    });

    it("all tool names have feednest_ prefix", async () => {
      const register = await loadPlugin();
      const { api, registered } = createMockApi();
      register(api as never);
      for (const tool of registered) {
        expect(tool.name).toMatch(/^feednest_/);
      }
    });

    it("read-only tools are not optional, write/ai tools are optional", async () => {
      const register = await loadPlugin();
      const { api, registered } = createMockApi();
      register(api as never);

      const readTools = [
        "feednest_get_articles",
        "feednest_get_article",
        "feednest_get_saved",
        "feednest_get_feeds",
        "feednest_get_folders",
        "feednest_get_tags",
        "feednest_get_highlights",
        "feednest_get_notes",
        "feednest_get_recently_read",
        "feednest_get_output_feeds",
        "feednest_get_stats",
      ];
      for (const name of readTools) {
        const tool = registered.find((t) => t.name === name);
        expect(tool?.optional, `${name} should not be optional`).toBe(false);
      }

      const writeTools = registered.filter((t) => !readTools.includes(t.name));
      for (const tool of writeTools) {
        expect(tool.optional, `${tool.name} should be optional`).toBe(true);
      }
    });

    it("every tool has description and parameters", async () => {
      const register = await loadPlugin();
      const { api, registered } = createMockApi();
      register(api as never);
      for (const tool of registered) {
        expect(tool.description).toBeTruthy();
        expect(tool.parameters).toBeDefined();
        expect(typeof tool.parameters).toBe("object");
      }
    });

    it("does not register subscribe/unsubscribe/search/discover/create_folder/create_output_feed tools", async () => {
      const register = await loadPlugin();
      const { api, registered } = createMockApi();
      register(api as never);
      const forbidden = [
        "subscribe",
        "unsubscribe",
        "search_feeds",
        "discover",
        "create_folder",
        "create_output_feed",
      ];
      for (const name of forbidden) {
        expect(
          registered.find((t) => t.name === `feednest_${name}`),
          `feednest_${name} should not exist`
        ).toBeUndefined();
      }
    });

    it("does not register summarize/translate tools", async () => {
      const register = await loadPlugin();
      const { api, registered } = createMockApi();
      register(api as never);
      const forbidden = ["summarize", "translate"];
      for (const name of forbidden) {
        expect(
          registered.find((t) => t.name === `feednest_${name}`)
        ).toBeUndefined();
      }
    });
  });

  describe("tool execution", () => {
    let registered: RegisteredTool[];

    async function setup() {
      const register = await loadPlugin();
      const mock = createMockApi();
      register(mock.api as never);
      registered = mock.registered;
    }

    function findTool(name: string): RegisteredTool {
      const tool = registered.find((t) => t.name === name);
      if (!tool) {
        throw new Error(`Tool ${name} not found`);
      }
      return tool;
    }

    it("get_articles calls correct view method", async () => {
      await setup();
      const tool = findTool("feednest_get_articles");
      const result = await tool.execute("agent-1", {
        view: "newsfeed",
        limit: 5,
      });
      expect(result.content[0].type).toBe("text");
    });

    it("get_articles handles unknown view", async () => {
      await setup();
      const tool = findTool("feednest_get_articles");
      const result = await tool.execute("agent-1", { view: "bogus" });
      expect(textOf(result)).toContain("Unknown view");
    });

    it("get_article returns formatted detail", async () => {
      await setup();
      const tool = findTool("feednest_get_article");
      const result = await tool.execute("agent-1", { article_id: "a1" });
      expect(textOf(result)).toContain("Test");
    });

    it("extract_article returns formatted detail", async () => {
      await setup();
      const tool = findTool("feednest_extract_article");
      const result = await tool.execute("agent-1", { article_id: "a1" });
      expect(textOf(result)).toContain("Test");
    });

    it("mark_as_read returns confirmation", async () => {
      await setup();
      const tool = findTool("feednest_mark_as_read");
      const result = await tool.execute("agent-1", { article_id: "a1" });
      expect(textOf(result)).toContain("marked as read");
    });

    it("mark_as_unread returns confirmation", async () => {
      await setup();
      const tool = findTool("feednest_mark_as_unread");
      const result = await tool.execute("agent-1", { article_id: "a1" });
      expect(textOf(result)).toContain("marked as unread");
    });

    it("mark_all_as_read returns confirmation", async () => {
      await setup();
      const tool = findTool("feednest_mark_all_as_read");
      const result = await tool.execute("agent-1", {});
      expect(textOf(result)).toContain("All articles marked as read");
    });

    it("save_article returns confirmation", async () => {
      await setup();
      const tool = findTool("feednest_save_article");
      const result = await tool.execute("agent-1", { article_id: "a1" });
      expect(textOf(result)).toContain("saved");
    });

    it("unsave_article returns confirmation", async () => {
      await setup();
      const tool = findTool("feednest_unsave_article");
      const result = await tool.execute("agent-1", { article_id: "a1" });
      expect(textOf(result)).toContain("removed from saved");
    });

    it("save_url returns saved title", async () => {
      await setup();
      const tool = findTool("feednest_save_url");
      const result = await tool.execute("agent-1", {
        url: "https://saved.com",
      });
      expect(textOf(result)).toContain("Saved");
    });

    it("get_saved returns formatted list", async () => {
      await setup();
      const tool = findTool("feednest_get_saved");
      const result = await tool.execute("agent-1", {});
      expect(textOf(result)).toContain("No saved articles");
    });

    it("get_feeds returns formatted list", async () => {
      await setup();
      const tool = findTool("feednest_get_feeds");
      const result = await tool.execute("agent-1", {});
      expect(textOf(result)).toContain("No feeds");
    });

    it("get_folders returns formatted list", async () => {
      await setup();
      const tool = findTool("feednest_get_folders");
      const result = await tool.execute("agent-1", {});
      expect(textOf(result)).toContain("No folders");
    });

    it("get_tags returns formatted list", async () => {
      await setup();
      const tool = findTool("feednest_get_tags");
      const result = await tool.execute("agent-1", {});
      expect(textOf(result)).toContain("No tags");
    });

    it("create_tag returns created tag", async () => {
      await setup();
      const tool = findTool("feednest_create_tag");
      const result = await tool.execute("agent-1", { name: "AI" });
      expect(textOf(result)).toContain("AI");
    });

    it("tag_article action=add calls tagArticle", async () => {
      await setup();
      const tool = findTool("feednest_tag_article");
      const result = await tool.execute("agent-1", {
        article_id: "a1",
        tag_id: "t1",
        action: "add",
      });
      expect(textOf(result)).toContain("added");
    });

    it("tag_article action=remove calls untagArticle", async () => {
      await setup();
      const tool = findTool("feednest_tag_article");
      const result = await tool.execute("agent-1", {
        article_id: "a1",
        tag_id: "t1",
        action: "remove",
      });
      expect(textOf(result)).toContain("removed");
    });

    it("get_highlights returns formatted list", async () => {
      await setup();
      const tool = findTool("feednest_get_highlights");
      const result = await tool.execute("agent-1", { article_id: "a1" });
      expect(textOf(result)).toContain("No highlights");
    });

    it("add_highlight returns confirmation", async () => {
      await setup();
      const tool = findTool("feednest_add_highlight");
      const result = await tool.execute("agent-1", {
        article_id: "a1",
        text: "important",
      });
      expect(textOf(result)).toContain("important");
    });

    it("remove_highlight returns confirmation", async () => {
      await setup();
      const tool = findTool("feednest_remove_highlight");
      const result = await tool.execute("agent-1", {
        article_id: "a1",
        highlight_id: "h1",
      });
      expect(textOf(result)).toContain("removed");
    });

    it("get_notes returns formatted note", async () => {
      await setup();
      const tool = findTool("feednest_get_notes");
      const result = await tool.execute("agent-1", { article_id: "a1" });
      expect(textOf(result)).toContain("My note");
    });

    it("add_note returns confirmation", async () => {
      await setup();
      const tool = findTool("feednest_add_note");
      const result = await tool.execute("agent-1", {
        article_id: "a1",
        content: "Note",
      });
      expect(textOf(result)).toContain("saved");
    });

    it("delete_note returns confirmation", async () => {
      await setup();
      const tool = findTool("feednest_delete_note");
      const result = await tool.execute("agent-1", { article_id: "a1" });
      expect(textOf(result)).toContain("deleted");
    });

    it("get_recently_read returns formatted list", async () => {
      await setup();
      const tool = findTool("feednest_get_recently_read");
      const result = await tool.execute("agent-1", {});
      expect(textOf(result)).toContain("No recently read");
    });

    it("get_output_feeds returns formatted list", async () => {
      await setup();
      const tool = findTool("feednest_get_output_feeds");
      const result = await tool.execute("agent-1", {});
      expect(textOf(result)).toContain("No output feeds");
    });

    it("text_to_speech returns audio URL", async () => {
      await setup();
      const tool = findTool("feednest_text_to_speech");
      const result = await tool.execute("agent-1", { article_id: "a1" });
      expect(textOf(result)).toContain("https://audio.com/a.mp3");
    });

    it("get_stats returns formatted stats", async () => {
      await setup();
      const tool = findTool("feednest_get_stats");
      const result = await tool.execute("agent-1", {});
      expect(textOf(result)).toContain("Streak: 7 days");
    });

    it("handles SDK errors gracefully (non-FeedNestError)", async () => {
      const { FeedNestClient } = await import("@feednest/sdk");
      const instance = new FeedNestClient({
        apiKey: "fn_live_test1234test1234test1234tt",
      });
      vi.mocked(instance.getStats).mockRejectedValueOnce(
        new Error("network failure")
      );
      const register = await loadPlugin();
      const mock = createMockApi();
      register(mock.api as never);
      const tool = mock.registered.find(
        (t) => t.name === "feednest_get_stats"
      )!;
      const result = await tool.execute("agent-1", {});
      expect(result.content[0].type).toBe("text");
      expect(textOf(result)).toContain("Something went wrong");
    });
  });

  describe("manifest", () => {
    it("openclaw.plugin.json is valid JSON with required fields", () => {
      const manifestPath = resolve(
        import.meta.dirname,
        "../../openclaw.plugin.json"
      );
      const raw = readFileSync(manifestPath, "utf-8");
      const manifest = JSON.parse(raw);
      expect(manifest.id).toBe("feednest");
      expect(manifest.configSchema).toBeDefined();
      expect(manifest.configSchema.required).toContain("apiKey");
    });

    it("configSchema marks apiKey as sensitive in uiHints", () => {
      const manifestPath = resolve(
        import.meta.dirname,
        "../../openclaw.plugin.json"
      );
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
      expect(manifest.uiHints?.apiKey?.sensitive).toBe(true);
    });
  });

  describe("parity with shared-tool-defs", () => {
    it("registers exactly the same tools as shared-tool-defs", async () => {
      const register = await loadPlugin();
      const { api, registered } = createMockApi();
      register(api as never);

      const registeredNames = new Set(
        registered.map((t) => t.name.replace(/^feednest_/, ""))
      );
      const definedNames = new Set(tools.map((t) => t.name));

      expect(registeredNames).toEqual(definedNames);
    });

    it("tool names map 1:1 with feednest_ prefix", async () => {
      const register = await loadPlugin();
      const { api, registered } = createMockApi();
      register(api as never);

      for (const tool of tools) {
        const found = registered.find(
          (t) => t.name === `feednest_${tool.name}`
        );
        expect(found, `Missing OpenClaw tool for ${tool.name}`).toBeDefined();
      }
    });
  });
});
