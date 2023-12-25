import { createTRPCRouter, protectedProcedure } from "@buds/server/api/trpc";
import { unauthorized } from "@buds/server/api/common";
import { startOfDay, subDays } from "date-fns";
import { Stat } from "@prisma/client";
import { v4 as uuid4 } from "uuid";

const select = {
  id: true,
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

    await db.stat.deleteMany();
    const stats: Stat[] = [];
    for (const user of includingMe) {
      const tracks = await db.track.findMany({ where: { userId: user.id } });
      for (const track of tracks) {
        for (let i = 0; i < 120; i++) {
          let value = 0;
          switch (track.name) {
            case "weight":
              value = Math.round(Math.random() * 120);
              break;
            case "mood":
              value = Math.round(Math.random() * 10);
              break;
            case "food":
            case "gym":
              value = Math.round(Math.random() * 1);
              break;
            default:
              throw new Error();
          }
          const now = startOfDay(new Date());
          const start = startOfDay(now);

          stats.push({
            id: uuid4(),
            type: "STAT",
            userId: user.id,
            trackId: track.id,
            value,
            date: startOfDay(subDays(start, i)),
            createdAt: start,
            updatedAt: start,
          });
        }
      }
    }
    await db.stat.createMany({ data: stats });
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
        OR: [
          {
            id: userId,
          },
          {
            followedBy: {
              some: {
                followerId: userId,
              },
            },
          },
        ],
      },
      select,
    });
  }),
});
