import { postRouter } from "@buds/server/api/routers/post";
import { createTRPCRouter } from "@buds/server/api/trpc";
import {statRouter} from "@buds/server/api/routers/stat";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  stat: statRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
