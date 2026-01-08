import { defineConfig } from "@playwright/test";

const mode = (process.env.PW_WEBSERVER_MODE || "prod").toLowerCase();
const baseURL = process.env.PW_BASE_URL ?? "http://127.0.0.1:3000";

const webServerCommand =
  mode === "dev" ? "npx next dev -H 127.0.0.1 -p 3000" : "npx next start -H 127.0.0.1 -p 3000";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: 0,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: webServerCommand,
    url: baseURL,
    reuseExistingServer: true,
    timeout: mode === "prod" ? 120_000 : 30_000,
  },
  reporter: [["list"]],
});
