import { createTRPCRouter, protectedProcedure } from "@buds/server/api/trpc";
import { unauthorized } from "@buds/server/api/common";
import { PrismaClient, User } from "@prisma/client";
import { z } from "zod";

const privateFields = {
  id: true,
  name: true,
  image: true,
  username: true,
  useMetric: true,
  checkMark: true,
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
      select: {
        id: true,
        name: true,
        image: true,
        tracks: {
          where: {
            OR: [
              {
                userId: userId,
              },
              {
                visibility: "Public",
              },
            ],
          },
        },
        username: true,
        useMetric: true,
        checkMark: true,
      },
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

      let users: User[] = [];
      if (query === "") {
        users = await db.user.findMany({
          where: { followedBy: { some: { followerId: userId } } },
          take: limit,
          skip: cursor,
          orderBy: { username: "asc" },
        });
      } else {
        users = await db.$queryRaw<User[]>`
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
      }

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
