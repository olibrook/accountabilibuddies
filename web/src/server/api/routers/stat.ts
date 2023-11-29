import { z } from "zod";
import {
  type Context,
  createTRPCRouter,
  protectedProcedure,
} from "@buds/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { differenceInDays, endOfToday, startOfToday, subDays } from "date-fns";
import { StatType } from "@prisma/client";
import { isFollowingAllOrThrow, unauthorized } from "@buds/server/api/common";

export const windowInDays = 30;

const ListStatsInput = z.object({
  followingIds: z.array(z.string().uuid()),
  start: z
    .date()
    .optional()
    .default((): Date => subDays(startOfToday(), windowInDays)),
  end: z
    .date()
    .optional()
    .default(() => endOfToday()),
});

const ListGoalsInput = z.object({
  followingIds: z.array(z.string().uuid()),
});

const CreateInput = z.object({
  date: z.date(),
  trackId: z.string().uuid(),
  value: z.number(),
});

type listInput = {
  followingIds: string[];
  start: Date;
  end: Date;
  type: StatType;
};

type StatList = {
  start: Date;
  end: Date;
  stats: Record<
    string,
    Record<
      string,
      {
        trackId: string;
        data: (number | undefined)[];
      }
    >
  >;
};

const list = async ({ input, ctx }: { input: listInput; ctx: Context }) => {
  const { start, end, followingIds, type } = input;
  const followerId = ctx?.session?.user.id;
  if (!followerId) {
    throw unauthorized();
  }
  await isFollowingAllOrThrow({
    db: ctx.db,
    followerId,
    followingIds,
  });

  const stats = await ctx.db.stat.findMany({
    where: {
      userId: { in: followingIds },
      type,
      date: {
        gte: start,
        lte: end,
      },
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

  const ret: StatList = { start, end, stats: {} };

  const dataLength = differenceInDays(end, start);

  stats.forEach((stat) => {
    const userId = stat.userId;
    const trackName = stat.track.name;
    const offset = Math.abs(differenceInDays(stat.date, end));

    ret.stats[userId] = ret.stats[userId] ?? {};
    ret.stats[userId][trackName] = ret.stats[userId][trackName] ?? {
      trackId: stat.track.id,
      data: Array.from(new Array(dataLength)).map(() => undefined),
    };
    ret.stats[stat.userId][stat.track.name].data[offset] = stat.value;
  });

  return ret;
};

type createInput = z.infer<typeof CreateInput> & { type: StatType };

const create = async ({ input, ctx }: { input: createInput; ctx: Context }) => {
  const userId = ctx?.session?.user.id;
  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return ctx.db.stat.create({
    data: {
      ...input,
      type: StatType.STAT,
      userId,
    },
  });
};

export const statRouter = createTRPCRouter({
  listStats: protectedProcedure
    .input(ListStatsInput)
    .query(async ({ input, ctx }) => {
      return list({ input: { ...input, type: StatType.STAT }, ctx });
    }),

  createStat: protectedProcedure
    .input(CreateInput)
    .query(async ({ input, ctx }) => {
      return create({ input: { ...input, type: StatType.STAT }, ctx });
    }),

  listGoals: protectedProcedure
    .input(ListGoalsInput)
    .query(async ({ input, ctx }) => {
      return list({ input: { ...input, type: StatType.GOAL }, ctx });
    }),

  createGoal: protectedProcedure
    .input(CreateInput)
    .query(async ({ input, ctx }) => {
      return create({ input: { ...input, type: StatType.STAT }, ctx });
    }),
});
