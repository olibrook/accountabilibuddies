import {postRouter} from "@buds/server/api/routers/post";
import {createTRPCRouter} from "@buds/server/api/trpc";
import {statRouter} from "@buds/server/api/routers/stat";
import {trackRouter} from "@buds/server/api/routers/track";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  stat: statRouter,
  track: trackRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
