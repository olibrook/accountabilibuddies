import { createTRPCRouter, protectedProcedure } from "@buds/server/api/trpc";
import { unauthorized } from "@buds/server/api/common";

export const userRouter = createTRPCRouter({
  listFollowing: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    const userId = ctx?.session?.user.id;
    if (!userId) {
      throw unauthorized();
    }
    return await db.user.findMany({
      where: {
        followedBy: {
          some: {
            followerId: userId,
          },
        },
      },
    });
  }),
});
