import { z } from "zod";
import {
  type Context,
  createTRPCRouter,
  protectedProcedure,
} from "@buds/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { differenceInDays, startOfDay, subDays } from "date-fns";
import { StatType } from "@prisma/client";
import { isFollowingAllOrThrow, unauthorized } from "@buds/server/api/common";

const ListStatsInput = z.object({
  followingIds: z.array(z.string().uuid()),
  cursor: z.date(),
  limit: z.number().int().positive(),
});

const ListGoalsInput = z.object({
  followingIds: z.array(z.string().uuid()),
  cursor: z.date(),
  limit: z.number().int().positive(),
});

const UpsertInput = z.object({
  date: z.date(),
  trackId: z.string().uuid(),
  value: z.number(),
});

type listInput = {
  followingIds: string[];
  cursor: Date;
  limit: number;
  type: StatType;
};

type StatList = {
  start: Date;
  end: Date;
  nextCursor: Date;
  results: Array<{
    date: Date;
    data: {
      [userId: string]: {
        [trackName: string]: number;
      };
    };
  }>;
};

const list = async ({ input, ctx }: { input: listInput; ctx: Context }) => {
  const { cursor, limit, followingIds, type } = input;
  const followerId = ctx?.session?.user.id;
  if (!followerId) {
    throw unauthorized();
  }
  await isFollowingAllOrThrow({
    db: ctx.db,
    followerId,
    followingIds,
  });

  const end = startOfDay(cursor);
  const start = startOfDay(subDays(end, Math.max(0, limit - 1)));

  const stats = await ctx.db.stat.findMany({
    where: {
      AND: [
        { userId: { in: followingIds } },
        { type },
        {
          date: {
            gt: start.toISOString(),
            lte: end.toISOString(),
          },
        },
      ],
    },
    select: {
      userId: true,
      value: true,
      date: true,
      track: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      {
        date: "desc",
      },
    ],
  });

  const ret: StatList = {
    start,
    end,
    nextCursor: startOfDay(subDays(end, limit)),
    results: Array.from(new Array(limit)).map((_, idx) => {
      return {
        date: subDays(end, idx),
        data: {},
      };
    }),
  };

  stats.forEach((stat) => {
    const userId = stat.userId;
    const trackName = stat.track.name;
    const offset = Math.abs(differenceInDays(startOfDay(stat.date), end));
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
    ret.results[offset].data[userId] = ret.results[offset].data[userId] ?? {};
    ret.results[offset].data[userId][trackName] = stat.value;
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
  };
  return ctx.db.stat.upsert({
    where: {
      type_userId_trackId_date: {
        date: input.date,
        trackId: input.trackId,
        userId,
        type: input.type,
      },
    },
    create: data,
    update: data,
  });
};

export const statRouter = createTRPCRouter({
  listStats: protectedProcedure
    .input(ListStatsInput)
    .query(async ({ input, ctx }) => {
      return list({ input: { ...input, type: StatType.STAT }, ctx });
    }),

  upsertStat: protectedProcedure
    .input(UpsertInput)
    .mutation(async ({ input, ctx }) => {
      return upsert({ input: { ...input, type: StatType.STAT }, ctx });
    }),

  listGoals: protectedProcedure
    .input(ListGoalsInput)
    .query(async ({ input, ctx }) => {
      return list({ input: { ...input, type: StatType.GOAL }, ctx });
    }),

  upsertGoal: protectedProcedure
    .input(UpsertInput)
    .mutation(async ({ input, ctx }) => {
      return upsert({ input: { ...input, type: StatType.STAT }, ctx });
    }),
});
