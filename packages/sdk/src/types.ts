/**
 * Public API v1 types for the FeedNest SDK.
 *
 * These are the single source of truth — flat, agent-friendly shapes
 * with no internal DB fields. Optional fields use `null` (not `undefined`).
 *
 * @module
 */

// ---------------------------------------------------------------------------
// Response wrappers
// ---------------------------------------------------------------------------

/** Standard API v1 response envelope. */
export type ApiV1Response<T> = {
  data: T;
  meta?: { has_more?: boolean };
};

/** Response for mutation endpoints that return no data. */
export type ApiV1ActionResponse = {
  success: true;
};

// ---------------------------------------------------------------------------
// Article
// ---------------------------------------------------------------------------

/** Summary representation of an article in list views. */
export interface ArticleV1 {
  highlights_count: number;
  id: string;
  image_url: string | null;
  is_read: boolean;
  is_saved: boolean;
  notes_count: number;
  published_at: string | null;
  source: string | null;
  summary_preview: string | null;
  tags: string[];
  title: string | null;
  url: string;
}

/** Full article detail including content, highlights, and note. */
export interface ArticleDetailV1 extends ArticleV1 {
  author: string | null;
  content: string | null;
  full_content: string | null;
  highlights: HighlightV1[];
  note: NoteV1 | null;
  reading_time_seconds: number | null;
}

// ---------------------------------------------------------------------------
// Recently Read
// ---------------------------------------------------------------------------

/** Article from the recently-read list with opened_at timestamp. */
export interface RecentlyReadV1 extends ArticleV1 {
  opened_at: string | null;
  reading_time_seconds: number | null;
}

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------

/** RSS feed subscription with unread count and folder membership. */
export interface FeedV1 {
  category: string | null;
  description: string | null;
  folder_ids: string[];
  id: string;
  image: string | null;
  name: string;
  unread_count: number;
  url: string;
}

// ---------------------------------------------------------------------------
// Folder
// ---------------------------------------------------------------------------

/** Feed folder with the number of feeds it contains. */
export interface FolderV1 {
  color: string;
  feed_count: number;
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Tag
// ---------------------------------------------------------------------------

/** User-defined tag with the number of tagged articles. */
export interface TagV1 {
  article_count: number;
  color: string;
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Highlight
// ---------------------------------------------------------------------------

/** Text highlight on an article with optional position offsets. */
export interface HighlightV1 {
  color: string;
  end_position: number | null;
  id: string;
  start_position: number | null;
  text: string;
}

// ---------------------------------------------------------------------------
// Note
// ---------------------------------------------------------------------------

/** User note on an article (single-note model — most recent note). */
export interface NoteV1 {
  article_id: string;
  content: string;
  created_at: string;
  id: string;
  total_notes_count: number;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Saved Article
// ---------------------------------------------------------------------------

/** Bookmarked/saved article with reading status and annotation flags. */
export interface SavedArticleV1 {
  has_highlights: boolean;
  has_notes: boolean;
  id: string;
  is_read: boolean;
  published_at: string | null;
  saved_at: string;
  source: string | null;
  tags: string[];
  title: string | null;
  url: string;
}

// ---------------------------------------------------------------------------
// Output Feed
// ---------------------------------------------------------------------------

/** Public RSS output feed created by the user. */
export interface OutputFeedV1 {
  created_at: string;
  id: string;
  public_url: string;
  slug: string | null;
  source_id: string;
  source_type: string;
  title: string | null;
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

/** Aggregated reading statistics for the user. */
export interface StatsV1 {
  articles_read_today: number;
  reading_time_today_minutes: number;
  saved_count: number;
  streak_days: number;
  total_feeds: number;
  unread_count: number;
}

// ---------------------------------------------------------------------------
// Text-to-Speech
// ---------------------------------------------------------------------------

/** Text-to-speech generation result with audio URL and duration. */
export interface TextToSpeechV1 {
  audio_url: string | null;
  duration_seconds: number;
  status?: "in_progress";
}

// ---------------------------------------------------------------------------
// SDK method option types
// ---------------------------------------------------------------------------

/** Shared pagination/filter options for article list methods. */
export interface ArticleListOptions {
  beforeId?: string;
  beforePublishedAt?: string;
  countOnly?: boolean;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  query?: string;
  sort?: "newest" | "oldest";
  unreadOnly?: boolean;
}

/** Response shape when `countOnly` is true. */
export interface ArticleCountResult {
  capped: boolean;
  count: number;
}

/** Options for the recently-read endpoint (uses opened_at for pagination). */
export interface RecentlyReadOptions {
  beforeId?: string;
  beforeOpenedAt?: string;
  dateTo?: string;
  limit?: number;
  query?: string;
  since?: string;
  sort?: "newest" | "oldest";
}

/** Options for listing feeds. */
export interface GetFeedsOptions {
  beforeId?: string;
  beforeName?: string;
  folderId?: string;
  limit?: number;
  query?: string;
}

/** Options for listing saved articles. */
export interface GetSavedOptions {
  beforeId?: string;
  beforePublishedAt?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  query?: string;
  sort?: "newest" | "oldest";
}

/** Options for marking all articles as read. */
export interface MarkAllAsReadOptions {
  feedId?: string;
  folderId?: string;
}

// ---------------------------------------------------------------------------
// Paginated response
// ---------------------------------------------------------------------------

/** Paginated list response with a hasMore flag. */
export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
}
