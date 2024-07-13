import { test } from "vitest";
import { mkUser, trpcCaller } from "@buds/test-utils";
import { db } from "@buds/server/db";
import { TrackVisibility } from "@prisma/client";

test("Creating and listing followers", async () => {
  const first = await mkUser();
  const second = await mkUser();
  const third = await mkUser();
  const fourth = await mkUser();
  const fifth = await mkUser();
  const users = [first, second, third, fourth, fifth];
  for (const u of users) {
    await db.track.create({
      data: { userId: u.id, name: "aaa", visibility: "Private" },
    });
    await db.track.create({
      data: { userId: u.id, name: "bbb", visibility: "Public" },
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

  const trpc = await trpcCaller(first);
  const following = await trpc.user.listFollowing();
  expect(new Set(following.map((u) => u.id))).toEqual(
    new Set([first.id, second.id, third.id]),
  );

  for (const user of following) {
    const isSelf = user.id === first.id;
    const expectedVisibilities = isSelf
      ? new Set([TrackVisibility.Private, TrackVisibility.Public])
      : new Set([TrackVisibility.Public]);
    const foundVisibilities = new Set(user.tracks.map((t) => t.visibility));
    expect(expectedVisibilities).toEqual(foundVisibilities);
  }
});
