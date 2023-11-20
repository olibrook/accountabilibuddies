import { createTRPCRouter, protectedProcedure } from "@buds/server/api/trpc";
import { unauthorized } from "@buds/server/api/common";

const select = {
  name: true,
  email: true,
  image: true,
  tracks: true,
};

export const userRouter = createTRPCRouter({
  seedMe: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    const userId = ctx?.session?.user.id;
    if (!userId) {
      throw unauthorized();
    }
    const me = ctx.session.user;

    const users = await db.user.findMany({ where: { id: { not: userId } } });

    for (const otherUser of users) {
      const data = {
        followerId: me.id,
        followingId: otherUser.id,
      };
      await db.follows.upsert({
        where: {
          followerId_followingId: data,
        },
        create: data,
        update: data,
      });
    }

    const includingMe = [...users, me];
    const tracks = ["weight", "mood", "food", "gym"];
    for (const user of includingMe) {
      for (const name of tracks) {
        const track = await db.track.upsert({
          where: { userId_name: { userId: user.id, name } },
          create: {
            userId: user.id,
            name,
          },
          update: {},
        });
        const sched = {
          trackId: track.id,
          userId: user.id,
          monday: true,
          tuesday: false,
          wednesday: true,
          thursday: false,
          friday: true,
          saturday: false,
          sunday: false,
        };
        await db.schedule.upsert({
          where: { trackId: track.id },
          create: sched,
          update: sched,
        });
      }
    }
  }),
  me: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    const userId = ctx?.session?.user.id;
    if (!userId) {
      throw unauthorized();
    }
    return await db.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
      select,
    });
  }),
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
      select,
    });
  }),
});
