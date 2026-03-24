/**
 * FeedNest SDK client for the public API v1.
 *
 * @example
 * ```typescript
 * import { FeedNestClient } from "@feednest/sdk";
 *
 * const client = new FeedNestClient({ apiKey: "fn_live_..." });
 * const { data, hasMore } = await client.getNewsfeedArticles({ limit: 10 });
 * ```
 *
 * @module
 */

import { FeedNestError } from "./errors";
import type {
  ApiV1Response,
  ArticleDetailV1,
  ArticleListOptions,
  ArticleV1,
  FeedV1,
  FolderV1,
  GetFeedsOptions,
  GetSavedOptions,
  HighlightV1,
  MarkAllAsReadOptions,
  NoteV1,
  OutputFeedV1,
  PaginatedResponse,
  RecentlyReadOptions,
  RecentlyReadV1,
  SavedArticleV1,
  StatsV1,
  TagV1,
  TextToSpeechV1,
} from "./types";

declare const __SDK_VERSION__: string;
const SDK_VERSION =
  typeof __SDK_VERSION__ === "undefined" ? "0.0.0-dev" : __SDK_VERSION__;
const DEFAULT_BASE_URL = "https://feednest.com";
const DEFAULT_TIMEOUT_MS = 30_000;

/** Configuration options for the FeedNest client. */
export interface FeedNestClientOptions {
  /** FeedNest API key (starts with `fn_live_` or `fn_test_`). */
  apiKey: string;
  /** Base URL of the FeedNest API. Defaults to `https://feednest.com`. */
  baseUrl?: string;
  /** Request timeout in milliseconds. Defaults to 30000 (30s). */
  timeout?: number;
}

/**
 * Typed HTTP client for the FeedNest public API v1.
 *
 * Every method maps 1:1 to an API endpoint. The client handles
 * authentication, error parsing, pagination, and timeout management.
 */
export class FeedNestClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(options: FeedNestClientOptions) {
    if (!options.apiKey) {
      throw new FeedNestError("apiKey is required", "UNAUTHORIZED");
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
  }

  // -------------------------------------------------------------------------
  // Internal HTTP
  // -------------------------------------------------------------------------

  private async _request<T>(
    method: string,
    path: string,
    body?: unknown,
    responseType: "json" | "text" = "json"
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.apiKey}`,
        "User-Agent": `@feednest/sdk/${SDK_VERSION}`,
      };
      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
      }

      const response = await fetch(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        await this._handleErrorResponse(response);
      }

      if (responseType === "text") {
        return (await response.text()) as T;
      }

      try {
        return (await response.json()) as T;
      } catch {
        throw new FeedNestError(
          "Failed to parse API response as JSON",
          "PARSE_ERROR"
        );
      }
    } catch (error) {
      if (error instanceof FeedNestError) {
        throw error;
      }
      if (
        (error instanceof DOMException && error.name === "AbortError") ||
        (error instanceof Error && error.name === "AbortError") ||
        controller.signal.aborted
      ) {
        throw new FeedNestError(
          `Request timed out after ${this.timeout}ms`,
          "TIMEOUT"
        );
      }
      throw new FeedNestError(
        error instanceof Error ? error.message : "Network request failed",
        "NETWORK_ERROR"
      );
    } finally {
      clearTimeout(timer);
    }
  }

  private async _handleErrorResponse(response: Response): Promise<never> {
    let message = `API error: ${response.status}`;
    let errorCode: string | undefined;

    try {
      const json = await response.json();
      message = json.error?.message ?? json.error ?? message;
      errorCode = json.error?.code;
    } catch {
      // response body wasn't JSON — use status text
    }

    const retryAfter = response.headers.get("Retry-After");

    switch (response.status) {
      case 401:
        throw new FeedNestError(message, "UNAUTHORIZED", { status: 401 });
      case 403:
        throw new FeedNestError(
          message,
          errorCode === "SUBSCRIPTION_REQUIRED"
            ? "SUBSCRIPTION_REQUIRED"
            : "FORBIDDEN",
          { status: 403 }
        );
      case 404:
        throw new FeedNestError(message, "NOT_FOUND", { status: 404 });
      case 422:
        throw new FeedNestError(message, "VALIDATION_ERROR", { status: 422 });
      case 429:
        throw new FeedNestError(message, "RATE_LIMITED", {
          status: 429,
          retryAfter: retryAfter ? Number.parseInt(retryAfter, 10) : undefined,
        });
      default:
        throw new FeedNestError(message, "INTERNAL_ERROR", {
          status: response.status,
        });
    }
  }

  // -------------------------------------------------------------------------
  // Helper: build query string from options
  // -------------------------------------------------------------------------

  private _articleParams(opts?: ArticleListOptions): string {
    if (!opts) {
      return "";
    }
    const p = new URLSearchParams();
    if (opts.limit != null) {
      p.set("limit", String(opts.limit));
    }
    if (opts.beforePublishedAt) {
      p.set("before_published_at", opts.beforePublishedAt);
    }
    if (opts.beforeId) {
      p.set("before_id", opts.beforeId);
    }
    if (opts.unreadOnly) {
      p.set("unread_only", "true");
    }
    if (opts.query) {
      p.set("q", opts.query);
    }
    if (opts.dateFrom) {
      p.set("date_from", opts.dateFrom);
    }
    if (opts.dateTo) {
      p.set("date_to", opts.dateTo);
    }
    if (opts.sort) {
      p.set("sort", opts.sort);
    }
    if (opts.countOnly) {
      p.set("count_only", "true");
    }
    const s = p.toString();
    return s ? `?${s}` : "";
  }

  private _parsePaginated<T>(res: ApiV1Response<T[]>): PaginatedResponse<T> {
    return {
      data: res.data,
      hasMore: res.meta?.has_more ?? false,
    };
  }

  // -------------------------------------------------------------------------
  // Feeds (read-only)
  // -------------------------------------------------------------------------

  /** List subscribed feeds with unread counts. */
  async getFeeds(opts?: GetFeedsOptions): Promise<PaginatedResponse<FeedV1>> {
    const p = new URLSearchParams();
    if (opts?.folderId) {
      p.set("folder_id", opts.folderId);
    }
    if (opts?.query) {
      p.set("q", opts.query);
    }
    if (opts?.limit != null) {
      p.set("limit", String(opts.limit));
    }
    if (opts?.beforeName) {
      p.set("before_name", opts.beforeName);
    }
    if (opts?.beforeId) {
      p.set("before_id", opts.beforeId);
    }
    const qs = p.toString();
    const res = await this._request<ApiV1Response<FeedV1[]>>(
      "GET",
      `/api/v1/feeds${qs ? `?${qs}` : ""}`
    );
    return this._parsePaginated(res);
  }

  /** Export all feeds as OPML XML. */
  async exportOpml(): Promise<string> {
    return this._request<string>(
      "GET",
      "/api/v1/feeds/export-opml",
      undefined,
      "text"
    );
  }

  // -------------------------------------------------------------------------
  // Articles — Lists
  // -------------------------------------------------------------------------

  /** Get articles from the user's newsfeed. */
  async getNewsfeedArticles(
    opts?: ArticleListOptions
  ): Promise<PaginatedResponse<ArticleV1>> {
    const res = await this._request<ApiV1Response<ArticleV1[]>>(
      "GET",
      `/api/v1/articles${this._articleParams(opts)}`
    );
    return this._parsePaginated(res);
  }

  /** Get articles from a specific feed. */
  async getArticlesByFeed(
    feedId: string,
    opts?: ArticleListOptions
  ): Promise<PaginatedResponse<ArticleV1>> {
    const res = await this._request<ApiV1Response<ArticleV1[]>>(
      "GET",
      `/api/v1/articles/by-feed/${feedId}${this._articleParams(opts)}`
    );
    return this._parsePaginated(res);
  }

  /** Get articles from a specific folder. */
  async getArticlesByFolder(
    folderId: string,
    opts?: ArticleListOptions
  ): Promise<PaginatedResponse<ArticleV1>> {
    const res = await this._request<ApiV1Response<ArticleV1[]>>(
      "GET",
      `/api/v1/articles/by-folder/${folderId}${this._articleParams(opts)}`
    );
    return this._parsePaginated(res);
  }

  /** Get articles with a specific tag. */
  async getArticlesByTag(
    tagId: string,
    opts?: ArticleListOptions
  ): Promise<PaginatedResponse<ArticleV1>> {
    const res = await this._request<ApiV1Response<ArticleV1[]>>(
      "GET",
      `/api/v1/articles/by-tag/${tagId}${this._articleParams(opts)}`
    );
    return this._parsePaginated(res);
  }

  /** Get all articles that have any tag. */
  async getArticlesWithTags(
    opts?: ArticleListOptions
  ): Promise<PaginatedResponse<ArticleV1>> {
    const res = await this._request<ApiV1Response<ArticleV1[]>>(
      "GET",
      `/api/v1/articles/tagged${this._articleParams(opts)}`
    );
    return this._parsePaginated(res);
  }

  /** Get articles that have highlights. */
  async getArticlesWithHighlights(
    opts?: ArticleListOptions
  ): Promise<PaginatedResponse<ArticleV1>> {
    const res = await this._request<ApiV1Response<ArticleV1[]>>(
      "GET",
      `/api/v1/articles/highlighted${this._articleParams(opts)}`
    );
    return this._parsePaginated(res);
  }

  /** Get articles that have notes. */
  async getArticlesWithNotes(
    opts?: ArticleListOptions
  ): Promise<PaginatedResponse<ArticleV1>> {
    const res = await this._request<ApiV1Response<ArticleV1[]>>(
      "GET",
      `/api/v1/articles/noted${this._articleParams(opts)}`
    );
    return this._parsePaginated(res);
  }

  /** Get recently read articles ordered by opened_at. */
  async getRecentlyRead(
    opts?: RecentlyReadOptions
  ): Promise<PaginatedResponse<RecentlyReadV1>> {
    const p = new URLSearchParams();
    if (opts?.limit != null) {
      p.set("limit", String(opts.limit));
    }
    if (opts?.since) {
      p.set("since", opts.since);
    }
    if (opts?.dateTo) {
      p.set("date_to", opts.dateTo);
    }
    if (opts?.beforeOpenedAt) {
      p.set("before_opened_at", opts.beforeOpenedAt);
    }
    if (opts?.beforeId) {
      p.set("before_id", opts.beforeId);
    }
    if (opts?.query) {
      p.set("q", opts.query);
    }
    if (opts?.sort) {
      p.set("sort", opts.sort);
    }
    const qs = p.toString();
    const res = await this._request<ApiV1Response<RecentlyReadV1[]>>(
      "GET",
      `/api/v1/articles/recently-read${qs ? `?${qs}` : ""}`
    );
    return this._parsePaginated(res);
  }

  // -------------------------------------------------------------------------
  // Articles — Single
  // -------------------------------------------------------------------------

  /** Get full details and content of a specific article. */
  async getArticle(articleId: string): Promise<ArticleDetailV1> {
    const res = await this._request<ApiV1Response<ArticleDetailV1>>(
      "GET",
      `/api/v1/articles/${articleId}`
    );
    return res.data;
  }

  /** Load full article content from the original URL. */
  async extractArticle(articleId: string): Promise<ArticleDetailV1> {
    const res = await this._request<ApiV1Response<ArticleDetailV1>>(
      "POST",
      `/api/v1/articles/${articleId}/extract`
    );
    return res.data;
  }

  // -------------------------------------------------------------------------
  // Articles — Actions
  // -------------------------------------------------------------------------

  /** Mark an article as read. */
  async markAsRead(articleId: string): Promise<void> {
    await this._request("POST", `/api/v1/articles/${articleId}/read`);
  }

  /** Mark an article as unread. */
  async markAsUnread(articleId: string): Promise<void> {
    await this._request("POST", `/api/v1/articles/${articleId}/unread`);
  }

  /** Mark all articles as read, optionally filtered by feed or folder. */
  async markAllAsRead(opts?: MarkAllAsReadOptions): Promise<void> {
    const body: Record<string, string> = {};
    if (opts?.feedId) {
      body.feed_id = opts.feedId;
    }
    if (opts?.folderId) {
      body.folder_id = opts.folderId;
    }
    await this._request(
      "POST",
      "/api/v1/articles/mark-all-read",
      Object.keys(body).length > 0 ? body : undefined
    );
  }

  // -------------------------------------------------------------------------
  // Saving
  // -------------------------------------------------------------------------

  /** Save an article for later reading. */
  async saveArticle(articleId: string): Promise<void> {
    await this._request("POST", `/api/v1/articles/${articleId}/save`);
  }

  /** Remove an article from saved items. */
  async unsaveArticle(articleId: string): Promise<void> {
    await this._request("DELETE", `/api/v1/articles/${articleId}/save`);
  }

  /** Save an external URL for later reading. */
  async saveUrl(url: string): Promise<SavedArticleV1> {
    const res = await this._request<ApiV1Response<SavedArticleV1>>(
      "POST",
      "/api/v1/saved/url",
      { url }
    );
    return res.data;
  }

  /** List saved articles. */
  async getSavedArticles(
    opts?: GetSavedOptions
  ): Promise<PaginatedResponse<SavedArticleV1>> {
    const p = new URLSearchParams();
    if (opts?.limit != null) {
      p.set("limit", String(opts.limit));
    }
    if (opts?.beforePublishedAt) {
      p.set("before_published_at", opts.beforePublishedAt);
    }
    if (opts?.beforeId) {
      p.set("before_id", opts.beforeId);
    }
    if (opts?.query) {
      p.set("q", opts.query);
    }
    if (opts?.dateFrom) {
      p.set("date_from", opts.dateFrom);
    }
    if (opts?.dateTo) {
      p.set("date_to", opts.dateTo);
    }
    if (opts?.sort) {
      p.set("sort", opts.sort);
    }
    const qs = p.toString();
    const res = await this._request<ApiV1Response<SavedArticleV1[]>>(
      "GET",
      `/api/v1/saved${qs ? `?${qs}` : ""}`
    );
    return this._parsePaginated(res);
  }

  // -------------------------------------------------------------------------
  // Highlights
  // -------------------------------------------------------------------------

  /** Get all highlights from an article. */
  async getHighlights(articleId: string): Promise<HighlightV1[]> {
    const res = await this._request<ApiV1Response<HighlightV1[]>>(
      "GET",
      `/api/v1/articles/${articleId}/highlights`
    );
    return res.data;
  }

  /** Highlight a text passage in an article. */
  async addHighlight(
    articleId: string,
    text: string,
    color?: string
  ): Promise<HighlightV1> {
    const body: Record<string, string> = { text };
    if (color) {
      body.color = color;
    }
    const res = await this._request<ApiV1Response<HighlightV1>>(
      "POST",
      `/api/v1/articles/${articleId}/highlights`,
      body
    );
    return res.data;
  }

  /** Remove a highlight from an article. */
  async removeHighlight(articleId: string, highlightId: string): Promise<void> {
    await this._request(
      "DELETE",
      `/api/v1/articles/${articleId}/highlights/${highlightId}`
    );
  }

  // -------------------------------------------------------------------------
  // Notes
  // -------------------------------------------------------------------------

  /** Get the note on an article. */
  async getNotes(articleId: string): Promise<NoteV1> {
    const res = await this._request<ApiV1Response<NoteV1>>(
      "GET",
      `/api/v1/articles/${articleId}/notes`
    );
    return res.data;
  }

  /** Add or update a note on an article. */
  async addNote(articleId: string, content: string): Promise<NoteV1> {
    const res = await this._request<ApiV1Response<NoteV1>>(
      "POST",
      `/api/v1/articles/${articleId}/notes`,
      { content }
    );
    return res.data;
  }

  /** Delete a note from an article. */
  async deleteNote(articleId: string): Promise<void> {
    await this._request("DELETE", `/api/v1/articles/${articleId}/notes`);
  }

  // -------------------------------------------------------------------------
  // Tags
  // -------------------------------------------------------------------------

  /** List all user tags. */
  async getTags(): Promise<TagV1[]> {
    const res = await this._request<ApiV1Response<TagV1[]>>(
      "GET",
      "/api/v1/tags"
    );
    return res.data;
  }

  /** Create a new tag for categorizing articles. */
  async createTag(name: string, color?: string): Promise<TagV1> {
    const body: Record<string, string> = { name };
    if (color) {
      body.color = color;
    }
    const res = await this._request<ApiV1Response<TagV1>>(
      "POST",
      "/api/v1/tags",
      body
    );
    return res.data;
  }

  /** Delete a tag by ID. */
  async deleteTag(tagId: string): Promise<void> {
    await this._request("DELETE", `/api/v1/tags/${tagId}`);
  }

  /** Add a tag to an article. */
  async tagArticle(articleId: string, tagId: string): Promise<void> {
    await this._request("POST", `/api/v1/articles/${articleId}/tags`, {
      tag_id: tagId,
    });
  }

  /** Remove a tag from an article. */
  async untagArticle(articleId: string, tagId: string): Promise<void> {
    await this._request(
      "DELETE",
      `/api/v1/articles/${articleId}/tags/${tagId}`
    );
  }

  // -------------------------------------------------------------------------
  // Folders (read-only)
  // -------------------------------------------------------------------------

  /** List all feed folders. */
  async getFolders(): Promise<FolderV1[]> {
    const res = await this._request<ApiV1Response<FolderV1[]>>(
      "GET",
      "/api/v1/folders"
    );
    return res.data;
  }

  // -------------------------------------------------------------------------
  // Output Feeds (read-only)
  // -------------------------------------------------------------------------

  /** List public RSS feeds created by the user. */
  async getOutputFeeds(): Promise<OutputFeedV1[]> {
    const res = await this._request<ApiV1Response<OutputFeedV1[]>>(
      "GET",
      "/api/v1/output-feeds"
    );
    return res.data;
  }

  // -------------------------------------------------------------------------
  // AI
  // -------------------------------------------------------------------------

  /** Generate audio from an article (text-to-speech). */
  async textToSpeech(articleId: string): Promise<TextToSpeechV1> {
    const res = await this._request<ApiV1Response<TextToSpeechV1>>(
      "POST",
      "/api/v1/ai/text-to-speech",
      { article_id: articleId }
    );
    return res.data;
  }

  // -------------------------------------------------------------------------
  // Stats
  // -------------------------------------------------------------------------

  /** Get reading statistics: streak, time, goals. */
  async getStats(): Promise<StatsV1> {
    const res = await this._request<ApiV1Response<StatsV1>>(
      "GET",
      "/api/v1/stats"
    );
    return res.data;
  }
}
