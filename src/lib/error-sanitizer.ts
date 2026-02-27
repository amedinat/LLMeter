/**
 * Error message sanitization for storage and client responses.
 * Prevents internal paths, stack traces, and sensitive data from leaking.
 * @module lib/error-sanitizer
 */

/** Patterns that indicate internal/sensitive info in error messages */
const SENSITIVE_PATTERNS = [
  /\/home\/[^\s]+/g,              // Unix paths
  /\/usr\/[^\s]+/g,
  /\/var\/[^\s]+/g,
  /[A-Z]:\\[^\s]+/g,             // Windows paths
  /\.next\/server\/[^\s]+/g,     // Next.js build paths
  /node_modules\/[^\s]+/g,       // Node module paths
  /at\s+\w+\s+\([^)]+\)/g,      // Stack trace frames
  /at\s+async\s+\w+\s+\([^)]+\)/g,
  /sk-[a-zA-Z0-9_-]{20,}/g,     // API keys (OpenAI, Anthropic, etc.)
  /Bearer\s+[a-zA-Z0-9_.-]+/gi, // Bearer tokens
  /password[=:]\s*\S+/gi,        // Password leaks
];

/** Max length for stored error messages */
const MAX_ERROR_LENGTH = 500;

/**
 * Sanitize an error message for DB storage (last_error column).
 * Removes file paths, stack traces, and API keys.
 * Truncates to MAX_ERROR_LENGTH.
 */
export function sanitizeErrorForStorage(message: string): string {
  let sanitized = message;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[redacted]');
  }
  return sanitized.slice(0, MAX_ERROR_LENGTH);
}

/**
 * Sanitize an error message for client-facing responses.
 * More aggressive — also strips internal error codes and DB details.
 */
export function sanitizeErrorForClient(message: string): string {
  let sanitized = sanitizeErrorForStorage(message);

  // Remove Supabase/Postgres error details
  sanitized = sanitized.replace(/PGRST\d+/g, '[db-error]');
  sanitized = sanitized.replace(/duplicate key value violates unique constraint "[^"]+"/g, 'Record already exists');
  sanitized = sanitized.replace(/relation "[^"]+" does not exist/g, 'Database configuration error');

  return sanitized;
}
