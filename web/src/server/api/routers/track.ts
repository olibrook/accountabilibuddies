import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@buds/server/api/trpc";
import { isFollowingAllOrThrow } from "@buds/server/api/common";
import { Prisma } from "@prisma/client";
import { toDate, toDateStringUTC, ZDateString } from "@buds/shared/utils";
import { TRPCError } from "@trpc/server";
import { addDays } from "date-fns";

const ListTracksInput = z.object({
  userId: z.string().uuid(),
});

const UpsertTrackInput = z.object({
  id: z.string().uuid(),
  name: z.string(),
  schedules: z
    .array(
      z.object({
        effectiveFrom: ZDateString,
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
      effectiveFrom: true,
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true,
    },
    take: 1,
    orderBy: {
      effectiveFrom: "desc" as const,
    },
  },
};

type DeepTrack = Prisma.TrackGetPayload<{
  select: typeof select;
}>;

const mapTrack = (track: DeepTrack) => ({
  ...track,
  schedules: track.schedules.map((sched) => ({
    ...sched,
    effectiveFrom: toDateStringUTC(sched.effectiveFrom),
  })),
});

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

      const tracks = await ctx.db.track.findMany({
        where: {
          userId: userId,
        },
        orderBy: [{ createdAt: "desc" }],
        select,
      });
      return tracks.map(mapTrack);
    }),

  upsert: protectedProcedure
    .input(UpsertTrackInput)
    .mutation(async ({ input, ctx }) => {
      const { schedules, ...trackData } = input;
      const scheduleData = schedules[0];
      if (!scheduleData) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

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
      await ctx.db.schedule.deleteMany({
        where: {
          trackId: track.id,
          effectiveFrom: { gte: toDate(scheduleData.effectiveFrom) },
        },
      });

      await ctx.db.schedule.updateMany({
        where: { trackId: track.id },
        data: { effectiveTo: addDays(toDate(scheduleData.effectiveFrom), -1) },
      });

      await ctx.db.schedule.create({
        data: {
          ...scheduleData,
          userId,
          trackId: track.id,
          effectiveFrom: toDate(scheduleData.effectiveFrom),
        },
      });
      const ret = await ctx.db.track.findUniqueOrThrow({
        where: { id: track.id },
        select,
      });
      return mapTrack(ret);
    }),
});
