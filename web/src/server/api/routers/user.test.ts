import { test } from "vitest";
import { mkUser, trpcCaller } from "@buds/test-utils";
import { db } from "@buds/server/db";

test("Creating and listing followers", async () => {
  const first = await mkUser();
  const second = await mkUser();
  const third = await mkUser();
  const fourth = await mkUser();
  const fifth = await mkUser();
  const users = [first, second, third, fourth, fifth];
  for (const u of users) {
    await db.track.create({
      data: { userId: u.id, name: "private", visibility: "Private" },
    });
    await db.track.create({
      data: { userId: u.id, name: "public", visibility: "Public" },
    });
  }

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
    new Set([first.id, second.id, third.id]),
  );

  expect(firstFollowing).toEqual({});

  const thirdCaller = await trpcCaller(third);
  const thirdFollowing = await thirdCaller.user.listFollowing();
  expect(new Set(thirdFollowing.map((u) => u.id))).toEqual(
    new Set([first.id, third.id]),
  );
});
