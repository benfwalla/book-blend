import { z } from "zod";

// Extracts Goodreads user ID or username from raw input
// Supports:
// - "42944663"
// - "42944663-ben-wallace"
// - "https://www.goodreads.com/user/show/42944663-ben-wallace"
// - "https://www.goodreads.com/user/show/42944663"
// - "https://www.goodreads.com/bewal416" (username-only format)
// - "bewal416" (username)
// - any string containing a user ID token
export function extractGoodreadsUserId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // If it's a URL, try to extract ID or username
  try {
    const url = new URL(trimmed);
    if (url.hostname === 'www.goodreads.com' || url.hostname === 'goodreads.com') {
      // Try to find /user/show/<id> format first
      const userShowMatch = url.pathname.match(/\/user\/show\/(\d+)/);
      if (userShowMatch?.[1]) return userShowMatch[1];
      
      // Try username-only format: /username (no /user/show/)
      const usernameMatch = url.pathname.match(/^\/([a-zA-Z0-9_-]+)$/);
      if (usernameMatch?.[1]) {
        // Return the username prefixed with 'username:' to distinguish from numeric IDs
        return `username:${usernameMatch[1]}`;
      }
    }
  } catch {
    // not a URL; fall through
  }

  // If it's an id-with-slug like 42944663-ben-wallace
  const idSlug = trimmed.match(/^(\d{3,})(?:-[a-z0-9-]+)?$/i);
  if (idSlug?.[1]) return idSlug[1];

  // Check if it's a username (alphanumeric with underscores/hyphens, not purely numeric)
  const usernamePattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
  if (usernamePattern.test(trimmed)) {
    return `username:${trimmed}`;
  }

  // Fallback: first long-ish digit run in the string
  const digits = trimmed.match(/(\d{3,})/);
  if (digits?.[1]) return digits[1];

  return null;
}

export const userIdSchema = z
  .string()
  .min(1)
  .transform((val) => extractGoodreadsUserId(val) ?? "")
  .refine((val) => /^\d{3,}$/.test(val) || /^username:[a-zA-Z][a-zA-Z0-9_-]*$/.test(val), { 
    message: "Enter a valid Goodreads user ID, username, or URL" 
  });
