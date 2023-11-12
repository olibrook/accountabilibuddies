import { PrismaClient } from "@prisma/client";

import { env } from "@buds/env.mjs";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;



// Namespace for typing Prisma JSON fields.
// https://www.npmjs.com/package/prisma-json-types-generator
declare global {
  namespace PrismaJson {
    type ExampleType = { foo: string; bar: number };
  }
}