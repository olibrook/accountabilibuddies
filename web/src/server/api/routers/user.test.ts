import { test } from "vitest";
import { mkUser, trpcCaller } from "@buds/test-utils";
import { db } from "@buds/server/db";

test("Creating and listing tracks", async () => {
  const first = await mkUser();
  const second = await mkUser();
  const third = await mkUser();
  await mkUser();
  await mkUser();

  await db.follows.create({
    data: { followerId: first.id, followingId: second.id },
  });
  await db.follows.create({
    data: { followerId: first.id, followingId: third.id },
  });
  await db.follows.create({
    data: { followerId: third.id, followingId: first.id },
  });

  const firstCaller = await trpcCaller(first);
  const firstFollowing = await firstCaller.user.listFollowing();
  expect(new Set(firstFollowing.map((u) => u.id))).toEqual(
    new Set([second.id, third.id]),
  );

  const thirdCaller = await trpcCaller(third);
  const thirdFollowing = await thirdCaller.user.listFollowing();
  expect(new Set(thirdFollowing.map((u) => u.id))).toEqual(new Set([first.id]));
});
