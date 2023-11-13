import { z } from "zod";
import {
  Context,
  createTRPCRouter,
  protectedProcedure,
} from "@buds/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { endOfToday, startOfToday, subDays } from "date-fns";
import { StatType } from "@prisma/client";
import { isFollowingOrThrow, unauthorized } from "@buds/server/api/common";

export const windowInDays = 30;

const ListStatsInput = z.object({
  followingId: z.string().uuid(),
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
  followingId: z.string().uuid(),
});

const CreateInput = z
  .object({
    date: z.date(),
    trackId: z.string().uuid(),
    check: z.boolean().optional(),
    value: z.number().optional(),
  })
  .refine(
    (data) => !!data.check || !!data.value,
    "Either check or value should be filled in.",
  );

type listInput = {
  followingId: string;
  start?: Date;
  end?: Date;
  type: StatType;
};

const list = async ({ input, ctx }: { input: listInput; ctx: Context }) => {
  const { start, end, followingId, type } = input;
  const followerId = ctx?.session?.user.id;
  if (!followerId) {
    throw unauthorized();
  }
  await isFollowingOrThrow({ db: ctx.db, followerId, followingId });

  return ctx.db.stat.findMany({
    where: {
      userId: followingId,
      type,
      date: {
        gte: start,
        lte: end,
      },
    },
  });
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
