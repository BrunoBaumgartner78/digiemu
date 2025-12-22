import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: "https://digiemu.vercel.app",
    headless: true,
  },
});
