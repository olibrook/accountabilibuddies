import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@buds/server/api/trpc";
import { isFollowingOrThrow } from "@buds/server/api/common";

const ListTracksInput = z.object({
  followingId: z.string().uuid(),
});

const CreateTrackInput = z.object({
  name: z.string(),
  schedule: z.object({
    monday: z.boolean().optional().default(false),
    tuesday: z.boolean().optional().default(false),
    wednesday: z.boolean().optional().default(false),
    thursday: z.boolean().optional().default(false),
    friday: z.boolean().optional().default(false),
    saturday: z.boolean().optional().default(false),
    sunday: z.boolean().optional().default(false),
  }),
});

const include = { schedule: true };

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
        include,
      });
    }),

  create: protectedProcedure
    .input(CreateTrackInput)
    .query(async ({ input, ctx }) => {
      const { schedule, ...track } = input;

      const userId = ctx.session.user.id;
      const trackData = {
        ...track,
        userId,
      };
      const scheduleData = {
        ...schedule,
        userId,
      };
      return ctx.db.track.create({
        data: {
          ...trackData,
          schedule: {
            create: scheduleData,
          },
        },
        include,
      });
    }),
});
