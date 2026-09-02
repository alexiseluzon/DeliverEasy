const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

module.exports = createJestConfig({
  testEnvironment: "jsdom",
  setupFilesAfterEach: [],
  setupFilesAfterEnv: ["<rootDir>/tests/unit/setup.ts"],
  testMatch: ["<rootDir>/tests/unit/**/*.test.tsx"],
});
