import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@buds/server/api/trpc";
import { isFollowingAllOrThrow } from "@buds/server/api/common";

const ListTracksInput = z.object({
  userId: z.string().uuid(),
});

const CreateTrackInput = z.object({
  name: z.string(),
});

const include = { schedules: true };

export const trackRouter = createTRPCRouter({
  list: protectedProcedure
    .input(ListTracksInput)
    .query(async ({ input, ctx }) => {
      const { userId } = input;
      const followerId = ctx.session.user.id;
      await isFollowingAllOrThrow({
        db: ctx.db,
        followerId,
        followingIds: [userId],
      });

      return ctx.db.track.findMany({
        where: {
          userId: userId,
        },
        orderBy: [{ createdAt: "desc" }],
        include,
      });
    }),

  create: protectedProcedure
    .input(CreateTrackInput)
    .query(async ({ input, ctx }) => {
      const { ...track } = input;

      const userId = ctx.session.user.id;
      const trackData = {
        ...track,
        userId,
      };
      return ctx.db.track.create({
        data: {
          ...trackData,
        },
        include,
      });
    }),
});
