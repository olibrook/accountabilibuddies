import { z } from "zod";
import {
  type Context,
  createTRPCRouter,
  protectedProcedure,
} from "@buds/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { differenceInDays, subDays } from "date-fns";
import { StatType } from "@prisma/client";
import { isFollowingAllOrThrow, unauthorized } from "@buds/server/api/common";
import {
  DateString,
  toDate,
  toDateString,
  ZDateString,
} from "@buds/shared/utils";
import { calendarView } from "@buds/server/api/routers/calendar";

type ListInput = {
  followingIds: string[];
  cursor: DateString;
  limit: number;
  type: StatType;
};

const ListGoalsInput = z.object({
  followingIds: z.array(z.string().uuid()),
  cursor: ZDateString,
  limit: z.number().int().positive(),
});

const ZListStatsInput = z.object({
  followingIds: z.array(z.string().uuid()),
  cursor: ZDateString,
  limit: z.number().int().positive(),
});

const UpsertInput = z.object({
  date: ZDateString,
  trackId: z.string().uuid(),
  value: z.number(),
});

type StatList = {
  start: DateString;
  end: DateString;
  nextCursor: DateString;
  results: Array<{
    date: DateString;
    data: {
      [userId: string]: {
        [trackName: string]: { value: number | null; scheduled: boolean };
      };
    };
  }>;
};

const list = async ({ input, ctx }: { input: ListInput; ctx: Context }) => {
  const { db } = ctx;
  const { cursor, limit, followingIds } = input;
  const followerId = ctx?.session?.user.id;

  if (!followerId) {
    throw unauthorized();
  }
  await isFollowingAllOrThrow({
    db: ctx.db,
    followerId,
    followingIds,
  });

  const end = toDate(cursor);
  const start = subDays(end, Math.max(0, limit - 1));

  const stats = await calendarView(db, followingIds, start, end);

  const ret: StatList = {
    start: toDateString(start),
    end: toDateString(end),
    nextCursor: toDateString(subDays(end, limit)),
    results: Array.from(new Array(limit)).map((_, idx) => {
      const date = toDateString(subDays(end, idx));
      return {
        date,
        data: {},
      };
    }),
  };

  stats.forEach((stat) => {
    const userId = stat.userId;
    const trackName = stat.trackName;
    const offset = Math.abs(differenceInDays(stat.date, end));
    if (offset < 0 || offset >= ret.results.length) {
      console.error(JSON.stringify(stat, null, 2));
      console.error(
        JSON.stringify(
          {
            offset,
            start: start.toISOString(),
            end: end.toISOString(),
            date: stat.date.toISOString(),
          },
          null,
          2,
        ),
      );
      throw new Error(`Bounds check`);
    }
    ret.results[offset]!.data[userId] = ret.results[offset]!.data[userId] ?? {};
    ret.results[offset]!.data[userId]![trackName] = {
      value: stat.value,
      scheduled: stat.scheduled,
    };
  });
  return ret;
};

type UpsertInputType = z.infer<typeof UpsertInput> & {
  type: StatType;
};

const upsert = async ({
  input,
  ctx,
}: {
  input: UpsertInputType;
  ctx: Context;
}) => {
  const userId = ctx?.session?.user.id;
  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  const data = {
    ...input,
    userId,
    date: toDate(input.date),
  };
  return ctx.db.stat.upsert({
    where: {
      type_userId_trackId_date: {
        date: data.date,
        trackId: data.trackId,
        userId,
        type: data.type,
      },
    },
    create: data,
    update: data,
  });
};

export const statRouter = createTRPCRouter({
  listStats: protectedProcedure
    .input(ZListStatsInput)
    .query(async ({ input, ctx }) => {
      return list({ input: { ...input, type: StatType.STAT }, ctx });
    }),

  upsertStat: protectedProcedure
    .input(UpsertInput)
    .mutation(async ({ input, ctx }) => {
      const result = await upsert({
        input: { ...input, type: StatType.STAT },
        ctx,
      });
      return { ...result, date: toDateString(result.date) };
    }),

  upsertGoal: protectedProcedure
    .input(UpsertInput)
    .mutation(async ({ input, ctx }) => {
      return upsert({ input: { ...input, type: StatType.STAT }, ctx });
    }),
});
