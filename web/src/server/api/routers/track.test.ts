import { expect, test } from "vitest";
import { db } from "@buds/server/db";

test("Add user", async () => {
  await db.user.deleteMany();
  const createdUser = await db.user.create({
    data: {
      email: "user1@example.com",
    },
  });

  expect(
    await db.user.findFirst({
      where: {
        id: createdUser.id,
      },
    }),
  ).toStrictEqual(createdUser);
  expect(await db.user.count()).toBe(1);
});

test("Count user", async () => {
  expect(await db.user.count()).toBe(0);
});
