import { createTRPCRouter, protectedProcedure } from "@buds/server/api/trpc";
import { unauthorized } from "@buds/server/api/common";
import { startOfDay, subDays } from "date-fns";
import { PrismaClient, Stat, User } from "@prisma/client";
import { v4 as uuid4 } from "uuid";
import { z } from "zod";

const publicFields = {
  id: true,
  name: true,
  image: true,
  tracks: true,
  username: true,
  useMetric: true,
  checkMark: true,
};

const privateFields = {
  ...publicFields,
  email: true,
};

const UpdateMeInput = z.object({
  username: z.string().optional(),
  useMetric: z.boolean().optional(),
  checkMark: z.string().optional(),
});

const UsernameAvailableInput = z.object({
  username: z.string(),
});

const SetFollowingInput = z.object({
  followingId: z.string().uuid(),
  shouldFollow: z.boolean(),
});

const SearchInput = z.object({
  cursor: z.number().nonnegative(),
  limit: z.number().nonnegative().max(50),
  query: z.string(),
});

type UserWithFollowInfo = User & { following: boolean };

const upsertTracks = async (db: PrismaClient, users: { id: string }[]) => {
  const tracks = ["weight", "mood", "food", "gym"];
  for (const user of users) {
    for (const name of tracks) {
      await db.track.upsert({
        where: { userId_name: { userId: user.id, name } },
        create: {
          userId: user.id,
          name,
        },
        update: {},
      });
    }
  }
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
    const user = await db.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
      select: privateFields,
    });
    await upsertTracks(db, [user]);
    return user;
  }),
  updateMe: protectedProcedure
    .input(UpdateMeInput)
    .mutation(async ({ input, ctx }) => {
      const { db } = ctx;
      const userId = ctx?.session?.user.id;
      if (!userId) {
        throw unauthorized();
      }
      await db.user.findUniqueOrThrow({
        where: {
          id: userId,
        },
      });
      return await db.user.update({
        where: {
          id: userId,
        },
        data: input,
        select: privateFields,
      });
    }),
  listFollowing: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    const userId = ctx?.session?.user.id;
    if (!userId) {
      throw unauthorized();
    }
    const users = await db.user.findMany({
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
      select: publicFields,
    });
    await upsertTracks(db, users);
    return users;
  }),
  usernameAvailable: protectedProcedure
    .input(UsernameAvailableInput)
    .mutation(async ({ input: { username }, ctx }) => {
      const { db } = ctx;
      const userId = ctx?.session?.user.id;
      if (!userId) {
        throw unauthorized();
      }
      const existing = await db.user.findUnique({
        where: {
          username: username,
        },
      });
      return !Boolean(existing);
    }),
  search: protectedProcedure
    .input(SearchInput)
    .query(async ({ input, ctx }): Promise<UserWithFollowInfo[]> => {
      const { db } = ctx;
      const userId = ctx?.session?.user.id;
      if (!userId) {
        throw unauthorized();
      }
      const { cursor, limit, query } = input;
      if (query === "") {
        return [] as UserWithFollowInfo[];
      }

      const users = await db.$queryRaw<User[]>`
          SELECT *,
            GREATEST(
              similarity(email, ${query}),
              similarity(username, ${query})
            ) AS similarity_score
          FROM "User"
          WHERE username ILIKE '%' || ${query} || '%' 
                AND id != ${userId}
          ORDER BY similarity_score DESC
          LIMIT ${limit}
          OFFSET ${cursor};
        `;

      const ids = users.map((u: User) => u.id);

      const follows = await db.follows.findMany({
        where: {
          AND: [{ followerId: userId }, { followingId: { in: ids } }],
        },
      });
      const followingIds = new Set(follows.map((f) => f.followingId));
      return users.map((u) => ({ ...u, following: followingIds.has(u.id) }));
    }),
  setFollowing: protectedProcedure
    .input(SetFollowingInput)
    .mutation(async ({ input: { followingId, shouldFollow }, ctx }) => {
      const { db } = ctx;
      const userId = ctx?.session?.user.id;
      if (!userId) {
        throw unauthorized();
      }
      const data = {
        followerId: userId,
        followingId,
      };
      if (shouldFollow) {
        await db.follows.upsert({
          where: { followerId_followingId: data },
          create: data,
          update: data,
        });
      } else {
        await db.follows.delete({
          where: {
            followerId_followingId: data,
          },
        });
      }
    }),
});
