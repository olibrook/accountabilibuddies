import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@buds/server/api/trpc";
import { isFollowingAllOrThrow } from "@buds/server/api/common";
import { v4 as uuid4 } from "uuid";

const ListTracksInput = z.object({
  userId: z.string().uuid(),
});

const UpsertTrackInput = z.object({
  id: z.string().uuid(),
  name: z.string(),
  schedules: z
    .array(
      z.object({
        monday: z.boolean(),
        tuesday: z.boolean(),
        wednesday: z.boolean(),
        thursday: z.boolean(),
        friday: z.boolean(),
        saturday: z.boolean(),
        sunday: z.boolean(),
      }),
    )
    .length(1),
});

const select = {
  id: true,
  name: true,
  schedules: {
    select: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true,
    },
  },
};

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
        select,
      });
    }),

  upsert: protectedProcedure
    .input(UpsertTrackInput)
    .mutation(async ({ input, ctx }) => {
      const { schedules, ...trackData } = input;
      const scheduleData = schedules[0];

      const userId = ctx.session.user.id;
      const trackUpsertData = {
        ...trackData,
        userId,
      };
      const track = await ctx.db.track.upsert({
        where: { id: trackUpsertData.id },
        create: trackUpsertData,
        update: trackUpsertData,
        select,
      });
      const existingSchedule = await ctx.db.schedule.findFirst({
        where: { trackId: track.id },
        orderBy: { createdAt: "desc" },
      });
      const scheduleUpsertData = {
        ...scheduleData,
        userId,
        id: existingSchedule?.id ?? uuid4(),
        trackId: track.id,
      };
      await ctx.db.schedule.upsert({
        where: { id: scheduleUpsertData.id },
        create: scheduleUpsertData,
        update: scheduleUpsertData,
      });
      return ctx.db.track.findUniqueOrThrow({
        where: { id: track.id },
        select,
      });
    }),
});
