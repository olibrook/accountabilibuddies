// See https://github.com/aiji42/vitest-environment-vprisma/tree/main

import path from "path";
import { defineConfig } from "vite";
import "dotenv/config";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL required in env");
}

export default defineConfig({
  resolve: {
    alias: {
      "@buds": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "vprisma",
    setupFiles: ["vitest-environment-vprisma/setup", "vitest.setup.ts"],
    env: {
      ...process.env,
      DATABASE_URL: process.env.TEST_DATABASE_URL,
    },
  },
});
