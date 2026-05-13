#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Read the commit message
const commitMsgFile = process.argv[2] || ".git/COMMIT_EDITMSG";
const commitMsg = fs.readFileSync(commitMsgFile, "utf-8").trim();

// Conventional commit pattern
const conventionalCommitPattern =
  /^(feat|fix|chore|refactor|docs|test|ci):\s.{1,72}$/;

// Check if commit message matches pattern
if (!conventionalCommitPattern.test(commitMsg)) {
  console.error("\nInvalid commit message format!\n");
  console.error("Commit message must follow conventional commits format:");
  console.error("  <type>: <description>\n");
  console.error("Valid types: feat, fix, chore, refactor, docs, test, ci");
  console.error("Rules:");
  console.error("  - Use imperative mood (add not added)");
  console.error("  - Start with lowercase after type");
  console.error("  - No period at the end");
  console.error("  - Maximum 72 characters\n");
  console.error("Examples:");
  console.error("  feat: implement user registration endpoint");
  console.error("  fix: resolve login token expiry issue");
  console.error("  chore: update FastAPI dependencies\n");
  console.error(`Your message: "${commitMsg}"\n`);
  process.exit(1);
}

console.log("Commit message is valid");
process.exit(0);
