import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: 0,
  use: {
    baseURL: process.env.PW_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  reporter: [["list"]],
});
