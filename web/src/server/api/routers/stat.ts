import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@buds/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { endOfToday, startOfToday, subDays } from "date-fns";
import { PrismaClient, StatType } from "@prisma/client";

export const windowInDays = 30;

const ListInput = z.object({
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

const isFollowing = async (
  db: PrismaClient,
  followerId: string,
  followingId: string,
): Promise<boolean> => {
  if (followerId === followingId) {
    return true;
  } else {
    const follow = await db.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
    return Boolean(follow);
  }
};

const isFollowingOrThrow = async (
  db: PrismaClient,
  followerId: string,
  followingId: string,
): Promise<boolean> => {
  const following = await isFollowing(db, followerId, followingId);
  if (!following) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return true;
};

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

export const statRouter = createTRPCRouter({
  list: protectedProcedure.input(ListInput).query(async ({ input, ctx }) => {
    const { start, end, followingId } = input;
    const followerId = ctx.session.user.id;
    await isFollowingOrThrow(ctx.db, followerId, followingId);
    return await ctx.db.stat.findMany({
      where: {
        userId: followingId,
        type: StatType.STAT,
        date: {
          gte: start,
          lte: end,
        },
      },
    });
  }),

  create: protectedProcedure
    .input(CreateInput)
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      return await ctx.db.stat.create({
        data: {
          ...input,
          userId,
        },
      });
    }),
});
