import { User } from "@prisma/client";
import { db } from "@buds/server/db";
import { v4 as uuid4 } from "uuid";
import { addMonths } from "date-fns";
import { appRouter } from "@buds/server/api/root";
import { faker } from "@faker-js/faker";

export const trpcCaller = async (user: User) => {
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

export const mkUser = () => {
  return db.user.create({
    data: {
      email: faker.internet.email(),
      name: faker.person.fullName(),
    },
  });
};

export const mkUserWithTRPC = async () => {
  const user = await mkUser();
  const trpc = await trpcCaller(user);
  return { user, trpc };
};
