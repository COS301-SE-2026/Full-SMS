#!/usr/bin/env node

const { execSync } = require("child_process");

// Get current branch name
let currentBranch;
try {
  currentBranch = execSync("git branch --show-current", {
    encoding: "utf-8",
  }).trim();
} catch (error) {
  console.error("Error: Could not determine current branch");
  process.exit(1);
}

// Protected branches that should never be committed to directly
const protectedBranches = ["main", "develop"];

if (protectedBranches.includes(currentBranch)) {
  console.error(
    "\nError: Direct commits to protected branches are not allowed!\n",
  );
  console.error(`You are trying to commit to: ${currentBranch}`);
  console.error("Protected branches: main, develop\n");
  console.error("Please create a feature branch instead:");
  console.error("  git checkout develop");
  console.error("  git checkout -b feature/your-feature-name\n");
  process.exit(1);
}

// Valid branch name pattern
const branchPattern = /^(feature|bugfix|chore|release)\/[a-z0-9-]+$/;

if (!branchPattern.test(currentBranch)) {
  console.error("\nError: Invalid branch name format!\n");
  console.error(`Current branch: ${currentBranch}`);
  console.error("Branch name must follow the pattern: <type>/<description>\n");
  console.error("Valid types:");
  console.error("  - feature/  : New features or enhancements");
  console.error("  - bugfix/   : Bug fixes and corrections");
  console.error("  - chore/    : Maintenance, dependencies, refactoring");
  console.error("  - release/  : Release preparation branches\n");
  console.error("Rules:");
  console.error("  - Use lowercase");
  console.error("  - Use hyphens to separate words");
  console.error("  - No spaces or special characters\n");
  console.error("Examples:");
  console.error("  feature/user-authentication");
  console.error("  bugfix/login-validation");
  console.error("  chore/update-dependencies\n");
  process.exit(1);
}

console.log("Branch name is valid");
process.exit(0);
