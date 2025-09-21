// Simple test script to verify URL parsing logic
// Run with: node test_url_parsing.js

// Copy the extractGoodreadsUserId function for testing
function extractGoodreadsUserId(input) {
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

// Test cases
const testCases = [
  // Existing formats that should still work
  { input: "42944663", expected: "42944663" },
  { input: "42944663-ben-wallace", expected: "42944663" },
  { input: "https://www.goodreads.com/user/show/42944663-ben-wallace", expected: "42944663" },
  { input: "https://www.goodreads.com/user/show/42944663", expected: "42944663" },
  
  // New username formats
  { input: "https://www.goodreads.com/bewal416", expected: "username:bewal416" },
  { input: "bewal416", expected: "username:bewal416" },
  { input: "user_name123", expected: "username:user_name123" },
  { input: "test-user", expected: "username:test-user" },
  
  // Edge cases
  { input: "", expected: null },
  { input: "123", expected: null }, // too short for ID
  { input: "12345", expected: "12345" }, // valid ID
  { input: "https://example.com/user", expected: null }, // wrong domain
  { input: "123abc", expected: null }, // starts with number, not valid username
];

console.log("Testing URL parsing logic...\n");

let passed = 0;
let failed = 0;

testCases.forEach(({ input, expected }, index) => {
  const result = extractGoodreadsUserId(input);
  const success = result === expected;
  
  if (success) {
    passed++;
    console.log(`✅ Test ${index + 1}: "${input}" → "${result}"`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: "${input}" → "${result}" (expected "${expected}")`);
  }
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log("🎉 All tests passed!");
} else {
  console.log("⚠️  Some tests failed. Please review the logic.");
  process.exit(1);
}
