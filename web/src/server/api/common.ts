import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export type followingParams = {
  db: PrismaClient;
  followerId: string;
  followingId: string;
};

export const isFollowing = async (
  params: followingParams,
): Promise<boolean> => {
  const { db, followerId, followingId } = params;

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

export const unauthorized = () => new TRPCError({ code: "UNAUTHORIZED" });

export const isFollowingOrThrow = async (
  params: followingParams,
): Promise<boolean> => {
  const following = await isFollowing(params);
  if (!following) {
    throw unauthorized();
  }
  return true;
};
