// See https://github.com/aiji42/vitest-environment-vprisma/tree/main

import { defineConfig } from "vite";

export default defineConfig({
  test: {
    globals: true,
    environment: "vprisma",
    setupFiles: ["vitest-environment-vprisma/setup", "vitest.setup.ts"],
    environmentOptions: {
      vprisma: {
        databaseUrl: process.env.TEST_DATABASE_URL,
      },
    },
  },
});
