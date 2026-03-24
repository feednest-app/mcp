import { describe, expectTypeOf, it } from "vitest";
import type { FeedNestClient } from "../client";
import type { FeedNestError, FeedNestErrorCode } from "../errors";
import type {
  ApiV1ActionResponse,
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
} from "../types";

describe("exported types conform to expected shapes", () => {
  it("ArticleV1 has required fields", () => {
    expectTypeOf<ArticleV1>().toHaveProperty("id");
    expectTypeOf<ArticleV1>().toHaveProperty("title");
    expectTypeOf<ArticleV1>().toHaveProperty("url");
    expectTypeOf<ArticleV1>().toHaveProperty("is_read");
    expectTypeOf<ArticleV1>().toHaveProperty("is_saved");
    expectTypeOf<ArticleV1>().toHaveProperty("tags");
    expectTypeOf<ArticleV1>().toHaveProperty("highlights_count");
    expectTypeOf<ArticleV1>().toHaveProperty("notes_count");
  });

  it("ArticleDetailV1 extends ArticleV1 with content fields", () => {
    expectTypeOf<ArticleDetailV1>().toMatchTypeOf<ArticleV1>();
    expectTypeOf<ArticleDetailV1>().toHaveProperty("content");
    expectTypeOf<ArticleDetailV1>().toHaveProperty("full_content");
    expectTypeOf<ArticleDetailV1>().toHaveProperty("highlights");
    expectTypeOf<ArticleDetailV1>().toHaveProperty("note");
    expectTypeOf<ArticleDetailV1>().toHaveProperty("reading_time_seconds");
  });

  it("RecentlyReadV1 extends ArticleV1 with opened_at", () => {
    expectTypeOf<RecentlyReadV1>().toMatchTypeOf<ArticleV1>();
    expectTypeOf<RecentlyReadV1>().toHaveProperty("opened_at");
    expectTypeOf<RecentlyReadV1>().toHaveProperty("reading_time_seconds");
  });

  it("FeedV1 has required fields", () => {
    expectTypeOf<FeedV1>().toHaveProperty("id");
    expectTypeOf<FeedV1>().toHaveProperty("name");
    expectTypeOf<FeedV1>().toHaveProperty("url");
    expectTypeOf<FeedV1>().toHaveProperty("unread_count");
    expectTypeOf<FeedV1>().toHaveProperty("folder_ids");
  });

  it("FolderV1 has required fields", () => {
    expectTypeOf<FolderV1>().toHaveProperty("id");
    expectTypeOf<FolderV1>().toHaveProperty("name");
    expectTypeOf<FolderV1>().toHaveProperty("color");
    expectTypeOf<FolderV1>().toHaveProperty("feed_count");
  });

  it("TagV1 has required fields", () => {
    expectTypeOf<TagV1>().toHaveProperty("id");
    expectTypeOf<TagV1>().toHaveProperty("name");
    expectTypeOf<TagV1>().toHaveProperty("color");
    expectTypeOf<TagV1>().toHaveProperty("article_count");
  });

  it("HighlightV1 has required fields", () => {
    expectTypeOf<HighlightV1>().toHaveProperty("id");
    expectTypeOf<HighlightV1>().toHaveProperty("text");
    expectTypeOf<HighlightV1>().toHaveProperty("color");
  });

  it("NoteV1 has required fields", () => {
    expectTypeOf<NoteV1>().toHaveProperty("id");
    expectTypeOf<NoteV1>().toHaveProperty("article_id");
    expectTypeOf<NoteV1>().toHaveProperty("content");
    expectTypeOf<NoteV1>().toHaveProperty("total_notes_count");
  });

  it("SavedArticleV1 has required fields", () => {
    expectTypeOf<SavedArticleV1>().toHaveProperty("id");
    expectTypeOf<SavedArticleV1>().toHaveProperty("url");
    expectTypeOf<SavedArticleV1>().toHaveProperty("saved_at");
    expectTypeOf<SavedArticleV1>().toHaveProperty("has_highlights");
    expectTypeOf<SavedArticleV1>().toHaveProperty("has_notes");
  });

  it("OutputFeedV1 has required fields", () => {
    expectTypeOf<OutputFeedV1>().toHaveProperty("id");
    expectTypeOf<OutputFeedV1>().toHaveProperty("public_url");
    expectTypeOf<OutputFeedV1>().toHaveProperty("source_type");
  });

  it("StatsV1 has required fields", () => {
    expectTypeOf<StatsV1>().toHaveProperty("articles_read_today");
    expectTypeOf<StatsV1>().toHaveProperty("streak_days");
    expectTypeOf<StatsV1>().toHaveProperty("unread_count");
  });

  it("TextToSpeechV1 has required fields", () => {
    expectTypeOf<TextToSpeechV1>().toHaveProperty("audio_url");
    expectTypeOf<TextToSpeechV1>().toHaveProperty("duration_seconds");
  });

  it("ApiV1Response wraps data with optional meta", () => {
    expectTypeOf<ApiV1Response<string>>().toHaveProperty("data");
    expectTypeOf<ApiV1Response<string>>().toHaveProperty("meta");
  });

  it("ApiV1ActionResponse has success field", () => {
    expectTypeOf<ApiV1ActionResponse>().toHaveProperty("success");
  });

  it("PaginatedResponse has data array and hasMore flag", () => {
    expectTypeOf<PaginatedResponse<string>>().toHaveProperty("data");
    expectTypeOf<PaginatedResponse<string>>().toHaveProperty("hasMore");
  });

  it("FeedNestError has code, status, and retryAfter", () => {
    expectTypeOf<FeedNestError>().toHaveProperty("code");
    expectTypeOf<FeedNestError>().toHaveProperty("status");
    expectTypeOf<FeedNestError>().toHaveProperty("retryAfter");
    expectTypeOf<FeedNestError>().toHaveProperty("message");
  });

  it("FeedNestErrorCode includes all expected codes", () => {
    expectTypeOf<"UNAUTHORIZED">().toMatchTypeOf<FeedNestErrorCode>();
    expectTypeOf<"FORBIDDEN">().toMatchTypeOf<FeedNestErrorCode>();
    expectTypeOf<"SUBSCRIPTION_REQUIRED">().toMatchTypeOf<FeedNestErrorCode>();
    expectTypeOf<"NOT_FOUND">().toMatchTypeOf<FeedNestErrorCode>();
    expectTypeOf<"RATE_LIMITED">().toMatchTypeOf<FeedNestErrorCode>();
    expectTypeOf<"PARSE_ERROR">().toMatchTypeOf<FeedNestErrorCode>();
    expectTypeOf<"TIMEOUT">().toMatchTypeOf<FeedNestErrorCode>();
    expectTypeOf<"NETWORK_ERROR">().toMatchTypeOf<FeedNestErrorCode>();
  });

  it("option types have expected fields", () => {
    expectTypeOf<ArticleListOptions>().toHaveProperty("limit");
    expectTypeOf<ArticleListOptions>().toHaveProperty("query");
    expectTypeOf<ArticleListOptions>().toHaveProperty("sort");
    expectTypeOf<RecentlyReadOptions>().toHaveProperty("since");
    expectTypeOf<RecentlyReadOptions>().toHaveProperty("beforeOpenedAt");
    expectTypeOf<GetFeedsOptions>().toHaveProperty("folderId");
    expectTypeOf<GetSavedOptions>().toHaveProperty("dateFrom");
    expectTypeOf<MarkAllAsReadOptions>().toHaveProperty("feedId");
    expectTypeOf<MarkAllAsReadOptions>().toHaveProperty("folderId");
  });

  it("FeedNestClient method return types are correct", () => {
    expectTypeOf<FeedNestClient["getFeeds"]>().returns.resolves.toHaveProperty(
      "data"
    );
    expectTypeOf<
      FeedNestClient["getNewsfeedArticles"]
    >().returns.resolves.toHaveProperty("hasMore");
    expectTypeOf<
      FeedNestClient["getArticle"]
    >().returns.resolves.toMatchTypeOf<ArticleDetailV1>();
    expectTypeOf<
      FeedNestClient["getStats"]
    >().returns.resolves.toMatchTypeOf<StatsV1>();
    expectTypeOf<FeedNestClient["exportOpml"]>().returns.resolves.toBeString();
  });
});
