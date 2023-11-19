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

test("Creating and listing tracks", async () => {
  const user = await mkUser();
  const trpc = await trpcCaller(user);

  const tracks = await trpc.track.list({ followingId: user.id });
  expect(tracks.length).toBe(0);

  const data = {
    name: "weight-loss",
    schedule: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true,
    },
  };
  const track = await trpc.track.create(data);

  const tracks2 = await trpc.track.list({ followingId: user.id });
  expect(tracks2.map((t) => t.id)).toEqual([track.id]);

  const retrieved = tracks2[0];
  expect(retrieved).toMatchObject(data);
});
