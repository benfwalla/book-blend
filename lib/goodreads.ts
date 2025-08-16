import { z } from "zod";

// Extracts numeric Goodreads user ID from raw input
// Supports:
// - "42944663"
// - "42944663-ben-wallace"
// - "https://www.goodreads.com/user/show/42944663-ben-wallace"
// - any string containing a user ID token
export function extractGoodreadsUserId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // If it's a URL, try to find /user/show/<id>
  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/user\/show\/(\d+)/);
    if (match?.[1]) return match[1];
  } catch {
    // not a URL; fall through
  }

  // If it's an id-with-slug like 42944663-ben-wallace
  const idSlug = trimmed.match(/^(\d{3,})(?:-[a-z0-9-]+)?$/i);
  if (idSlug?.[1]) return idSlug[1];

  // Fallback: first long-ish digit run in the string
  const digits = trimmed.match(/(\d{3,})/);
  if (digits?.[1]) return digits[1];

  return null;
}

export const userIdSchema = z
  .string()
  .min(1)
  .transform((val) => extractGoodreadsUserId(val) ?? "")
  .refine((val) => /^\d{3,}$/.test(val), { message: "Enter a valid Goodreads user id or URL" });
