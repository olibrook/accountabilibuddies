import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@buds/server/api/trpc";
import { isFollowingOrThrow } from "@buds/server/api/common";

const ListTracksInput = z.object({
  followingId: z.string().uuid(),
});

const CreateTrackInput = z.object({
  name: z.string(),
});

export const trackRouter = createTRPCRouter({
  list: protectedProcedure
    .input(ListTracksInput)
    .query(async ({ input, ctx }) => {
      const { followingId } = input;
      const followerId = ctx.session.user.id;
      await isFollowingOrThrow({ db: ctx.db, followerId, followingId });

      return ctx.db.track.findMany({
        where: {
          userId: followingId,
        },
        orderBy: [{ createdAt: "desc" }],
      });
    }),

  create: protectedProcedure
    .input(CreateTrackInput)
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      return ctx.db.track.create({
        data: {
          ...input,
          userId,
        },
      });
    }),
});
