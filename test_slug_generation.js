// Test script for slug generation logic
// Run with: node test_slug_generation.js

function generateSlugFromName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

// Test cases based on your friends list
const testCases = [
  { name: "Ben Wallace", expected: "ben-wallace" },
  { name: "Brenna Stubenbort", expected: "brenna-stubenbort" },
  { name: "Arya Roessler", expected: "arya-roessler" },
  { name: "Elena Mnayarji", expected: "elena-mnayarji" },
  { name: "Katie", expected: "katie" },
  { name: "Caleb Soler", expected: "caleb-soler" },
  { name: "Clayton Marshall", expected: "clayton-marshall" },
  { name: "Chelsea Brennan", expected: "chelsea-brennan" },
  { name: "Sam Johnson", expected: "sam-johnson" },
  { name: "Joey", expected: "joey" },
  { name: "Donald Bough", expected: "donald-bough" },
  { name: "Melissa Bebchuk", expected: "melissa-bebchuk" },
  { name: "Zach Davis", expected: "zach-davis" },
  { name: "Ben Warnock", expected: "ben-warnock" },
  { name: "Dhara Shukla", expected: "dhara-shukla" },
  { name: "Ethon Koehler", expected: "ethon-koehler" },
  { name: "Alex Plaut", expected: "alex-plaut" },
  { name: "Joanne Bonoan", expected: "joanne-bonoan" },
  { name: "Mark O'Connell", expected: "mark-oconnell" },
  
  // Edge cases
  { name: "John O'Brien-Smith", expected: "john-obrien-smith" },
  { name: "Mary   Jane", expected: "mary-jane" },
  { name: "Test--User", expected: "test-user" },
  { name: "User@123", expected: "user123" },
];

console.log("Testing slug generation logic...\n");

let passed = 0;
let failed = 0;

testCases.forEach(({ name, expected }, index) => {
  const result = generateSlugFromName(name);
  const success = result === expected;
  
  if (success) {
    passed++;
    console.log(`✅ Test ${index + 1}: "${name}" → "${result}"`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: "${name}" → "${result}" (expected "${expected}")`);
  }
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log("🎉 All tests passed!");
  console.log("\nExample conflict resolution:");
  console.log("ben-wallace → ben-wallace");
  console.log("ben-wallace (conflict) → ben-wallace-1");
  console.log("ben-wallace (conflict) → ben-wallace-2");
} else {
  console.log("⚠️  Some tests failed. Please review the logic.");
}
