import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  // Next dev lazily compiles MDX routes. Keeping the journey serial prevents
  // concurrent first-load requests from racing on the same generated artifact.
  fullyParallel: false,
  workers: 1,
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000/zh/",
    reuseExistingServer: !process.env.CI,
  },
  use: { baseURL: "http://127.0.0.1:3000", trace: "on-first-retry" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"] } },
  ],
});
