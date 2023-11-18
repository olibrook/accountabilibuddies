// vitest.setup.ts
import { vi } from "vitest";

vi.mock("@buds/server/db", () => ({
  db: vPrisma.client,
}));
