import { describe, expect, it } from "vitest";
import { getToolByName, toJsonSchema, tools } from "../tools";

describe("tool definitions", () => {
  it("has exactly 26 tools", () => {
    expect(tools).toHaveLength(26);
  });

  it("every tool has name, title, description, parameters, annotations, and invocationText", () => {
    for (const tool of tools) {
      expect(typeof tool.name).toBe("string");
      expect(tool.name.length).toBeGreaterThan(0);

      expect(typeof tool.title).toBe("string");
      expect(
        tool.title.length,
        `${tool.name} title must not be empty`
      ).toBeGreaterThan(0);
      expect(
        tool.title.length,
        `${tool.name} title must be ≤ 64 chars`
      ).toBeLessThanOrEqual(64);

      expect(typeof tool.description).toBe("string");
      expect(tool.description.length).toBeGreaterThan(0);

      expect(tool.parameters).toBeDefined();
      expect(typeof tool.parameters.safeParse).toBe("function");

      expect(tool.annotations).toBeDefined();
      expect(typeof tool.annotations.readOnlyHint).toBe("boolean");
      expect(typeof tool.annotations.destructiveHint).toBe("boolean");
      expect(typeof tool.annotations.openWorldHint).toBe("boolean");

      expect(
        tool.invocationText,
        `${tool.name} must have invocationText`
      ).toBeDefined();
      expect(
        tool.invocationText.invoking.length,
        `${tool.name} invoking text must be ≤ 64 chars`
      ).toBeLessThanOrEqual(64);
      expect(
        tool.invocationText.invoked.length,
        `${tool.name} invoked text must be ≤ 64 chars`
      ).toBeLessThanOrEqual(64);
    }
  });

  it("all tool names are unique", () => {
    const names = tools.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("all tool titles are unique", () => {
    const titles = tools.map((t) => t.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("does NOT include subscribe/unsubscribe/search/discover/create_folder/create_output_feed", () => {
    const forbidden = [
      "subscribe",
      "unsubscribe",
      "search_feeds",
      "discover_feeds",
      "create_folder",
      "create_output_feed",
    ];
    const names = new Set(tools.map((t) => t.name));
    for (const name of forbidden) {
      expect(names.has(name)).toBe(false);
    }
  });

  it("includes create_tag tool", () => {
    expect(getToolByName("create_tag")).toBeDefined();
  });

  it("includes text_to_speech tool", () => {
    expect(getToolByName("text_to_speech")).toBeDefined();
  });

  it("get_articles tool has a view enum parameter", () => {
    const tool = getToolByName("get_articles");
    expect(tool).toBeDefined();
    const result = tool!.parameters.safeParse({ view: "newsfeed" });
    expect(result.success).toBe(true);
  });

  it("get_articles rejects invalid view", () => {
    const tool = getToolByName("get_articles");
    const result = tool!.parameters.safeParse({ view: "invalid_view" });
    expect(result.success).toBe(false);
  });

  it("tag_article requires action enum (add or remove)", () => {
    const tool = getToolByName("tag_article");
    expect(tool).toBeDefined();

    const valid = tool!.parameters.safeParse({
      article_id: "a1",
      tag_id: "t1",
      action: "add",
    });
    expect(valid.success).toBe(true);

    const validRemove = tool!.parameters.safeParse({
      article_id: "a1",
      tag_id: "t1",
      action: "remove",
    });
    expect(validRemove.success).toBe(true);

    const missingAction = tool!.parameters.safeParse({
      article_id: "a1",
      tag_id: "t1",
    });
    expect(missingAction.success).toBe(false);

    const invalidAction = tool!.parameters.safeParse({
      article_id: "a1",
      tag_id: "t1",
      action: "toggle",
    });
    expect(invalidAction.success).toBe(false);
  });

  it("read-only tools have readOnlyHint: true", () => {
    const readOnlyNames = [
      "get_articles",
      "get_article",
      "get_saved",
      "get_feeds",
      "get_folders",
      "get_tags",
      "get_highlights",
      "get_notes",
      "get_recently_read",
      "get_output_feeds",
      "get_stats",
    ];
    for (const name of readOnlyNames) {
      const tool = getToolByName(name);
      expect(
        tool?.annotations.readOnlyHint,
        `${name} should be read-only`
      ).toBe(true);
      expect(
        tool?.annotations.destructiveHint,
        `${name} should not be destructive`
      ).toBe(false);
    }
  });

  it("destructive tools have destructiveHint: true", () => {
    const destructiveNames = ["delete_tag", "remove_highlight", "delete_note"];
    for (const name of destructiveNames) {
      const tool = getToolByName(name);
      expect(
        tool?.annotations.readOnlyHint,
        `${name} should not be read-only`
      ).toBe(false);
      expect(
        tool?.annotations.destructiveHint,
        `${name} should be destructive`
      ).toBe(true);
    }
  });

  it("idempotent tools are correctly annotated", () => {
    const idempotentNames = [
      "get_articles",
      "get_article",
      "get_saved",
      "get_feeds",
      "get_folders",
      "get_tags",
      "get_highlights",
      "get_notes",
      "get_recently_read",
      "get_output_feeds",
      "get_stats",
      "extract_article",
      "mark_as_read",
      "mark_as_unread",
      "mark_all_as_read",
      "save_article",
      "unsave_article",
      "tag_article",
      "add_note",
      "add_highlight",
      "text_to_speech",
      "delete_tag",
      "delete_note",
      "remove_highlight",
    ];
    for (const name of idempotentNames) {
      const tool = getToolByName(name);
      expect(
        tool?.annotations.idempotentHint,
        `${name} should be idempotent`
      ).toBe(true);
    }

    const notIdempotentNames = ["save_url", "create_tag"];
    for (const name of notIdempotentNames) {
      const tool = getToolByName(name);
      expect(
        tool?.annotations.idempotentHint,
        `${name} should NOT be idempotent`
      ).toBeFalsy();
    }
  });

  it("no tool has openWorldHint: true", () => {
    for (const tool of tools) {
      expect(
        tool.annotations.openWorldHint,
        `${tool.name} should be closed-world`
      ).toBe(false);
    }
  });

  it("save_url validates the url parameter", () => {
    const tool = getToolByName("save_url");
    expect(tool).toBeDefined();

    const valid = tool!.parameters.safeParse({ url: "https://example.com" });
    expect(valid.success).toBe(true);

    const invalid = tool!.parameters.safeParse({ url: "not-a-url" });
    expect(invalid.success).toBe(false);
  });
});

describe("toJsonSchema", () => {
  it("returns a valid JSON Schema object for a known tool", () => {
    const schema = toJsonSchema("get_article");
    expect(schema).toHaveProperty("type", "object");
    expect(schema).toHaveProperty("properties");
    expect(
      (schema.properties as Record<string, unknown>).article_id
    ).toBeDefined();
  });

  it("throws for an unknown tool name", () => {
    expect(() => toJsonSchema("nonexistent_tool")).toThrow(
      "Unknown tool: nonexistent_tool"
    );
  });

  it("defaults to draft-07 schema", () => {
    const schema = toJsonSchema("get_article");
    expect(schema.$schema).toBe("http://json-schema.org/draft-07/schema#");
  });

  it("supports draft-2020-12 when specified", () => {
    const schema = toJsonSchema("get_article", "draft-2020-12");
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
  });

  it("produces JSON Schema for all 26 tools without errors", () => {
    for (const tool of tools) {
      const schema = toJsonSchema(tool.name);
      expect(schema).toHaveProperty("$schema");
    }
  });
});

describe("getToolByName", () => {
  it("returns the correct tool", () => {
    const tool = getToolByName("mark_as_read");
    expect(tool).toBeDefined();
    expect(tool!.name).toBe("mark_as_read");
  });

  it("returns undefined for unknown name", () => {
    expect(getToolByName("does_not_exist")).toBeUndefined();
  });
});
