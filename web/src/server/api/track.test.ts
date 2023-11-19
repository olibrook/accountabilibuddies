import { expect, test } from "vitest";
import { db } from "@buds/server/db";
import { faker } from "@faker-js/faker";
import { User } from "@prisma/client";
import { v4 as uuid4 } from "uuid";
import { addMonths } from "date-fns";
import { appRouter } from "@buds/server/api/root";

const trpcCaller = async (user: User) => {
  const session = await db.session.create({
    data: {
      userId: user.id,
      sessionToken: uuid4(),
      expires: addMonths(new Date(), 1),
    },
    include: {
      user: true,
    },
  });

  return appRouter.createCaller({
    session: {
      ...session,
      expires: session.expires.toISOString(),
    },
    headers: new Headers(),
    db,
  });
};

const mkUser = () => {
  return db.user.create({
    data: {
      email: faker.internet.email(),
      name: faker.person.fullName(),
    },
  });
};

test("Add user", async () => {
  const user = await mkUser();
  expect(
    await db.user.findFirst({
      where: {
        id: user.id,
      },
    }),
  ).toStrictEqual(user);
  expect(await db.user.count()).toBe(1);
});

test("Count user", async () => {
  expect(await db.user.count()).toBe(0);
});

test("Call TRPC endpoint", async () => {
  const user = await mkUser();
  const trpc = await trpcCaller(user);

  const tracks = await trpc.track.list({ followingId: user.id });
  expect(tracks.length).toBe(0);
});
