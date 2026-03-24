/**
 * Error types for the FeedNest SDK.
 *
 * @module
 */

/** All possible error codes returned by the SDK. */
export type FeedNestErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "SUBSCRIPTION_REQUIRED"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR"
  | "PARSE_ERROR"
  | "TIMEOUT";

/**
 * Custom error class for FeedNest API errors.
 *
 * Distinguishes between different failure modes (auth, rate limiting,
 * subscription, network) so consumers can handle each case appropriately.
 */
export class FeedNestError extends Error {
  /** Machine-readable error code for programmatic handling. */
  readonly code: FeedNestErrorCode;

  /** HTTP status code from the API response, if available. */
  readonly status: number | undefined;

  /** Retry-After header value in seconds (present on 429 responses). */
  readonly retryAfter: number | undefined;

  constructor(
    message: string,
    code: FeedNestErrorCode,
    options?: { status?: number; retryAfter?: number }
  ) {
    super(message);
    this.name = "FeedNestError";
    this.code = code;
    this.status = options?.status;
    this.retryAfter = options?.retryAfter;
  }
}
