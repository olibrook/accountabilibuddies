import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export type followingParams = {
  db: PrismaClient;
  followerId: string;
  followingIds: string[];
};

export const isFollowingAll = async (
  params: followingParams,
): Promise<boolean> => {
  const { db, followerId, followingIds } = params;

  // Everyone "follows" themselves, exclude from check.
  const otherIds = followingIds.filter((id) => id !== followerId);
  const count = await db.follows.count({
    where: {
      followerId,
      followingId: {
        in: otherIds,
      },
    },
  });

  // There was a record for each followingId, so followerId is
  // following everyone in the list of ids.
  return count === otherIds.length;
};

export const unauthorized = () => new TRPCError({ code: "UNAUTHORIZED" });

export const isFollowingAllOrThrow = async (
  params: followingParams,
): Promise<boolean> => {
  const following = await isFollowingAll(params);
  if (!following) {
    throw unauthorized();
  }
  return true;
};
