import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const backendCommand = process.platform === "win32"
  ? String.raw`.\env\Scripts\python.exe scripts\e2e_server.py`
  : "python scripts/e2e_server.py";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: backendCommand,
      cwd: path.resolve(__dirname, "../backend"),
      url: "http://127.0.0.1:8000/api/v1/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1",
      cwd: __dirname,
      url: "http://127.0.0.1:3000/login",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { BACKEND_URL: "http://127.0.0.1:8000" },
    },
  ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
