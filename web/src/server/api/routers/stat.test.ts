import { describe, expect, test } from "vitest";
import { mkUserWithTRPC } from "@buds/test-utils";
import { db } from "@buds/server/db";
import { toDateStringUTC } from "@buds/shared/utils";

describe("Listing Stats", () => {
  test("List stats, visibility", async () => {
    const u1 = await mkUserWithTRPC();
    const u2 = await mkUserWithTRPC();

    for (const u of [u1, u2]) {
      const privateTrack = await db.track.create({
        data: {
          userId: u.user.id,
          name: "embarrassing",
          visibility: "Private",
        },
      });
      await db.stat.create({
        data: {
          type: "STAT",
          userId: u.user.id,
          trackId: privateTrack.id,
          value: 123,
          date: new Date("2024-01-05"),
        },
      });
      const publicTrack = await db.track.create({
        data: {
          userId: u.user.id,
          name: "not-embarrassing",
          visibility: "Public",
        },
      });
      await db.stat.create({
        data: {
          type: "STAT",
          userId: u.user.id,
          trackId: publicTrack.id,
          value: 456,
          date: new Date("2024-01-05"),
        },
      });
    }

    await db.follows.create({
      data: { followerId: u1.user.id, followingId: u2.user.id },
    });
    await db.follows.create({
      data: { followerId: u2.user.id, followingId: u1.user.id },
    });

    const pairs = [
      { self: u1, other: u2 },
      { self: u2, other: u1 },
    ];
    for (const pair of pairs) {
      const { self, other } = pair;

      const selfStats = await self.trpc.stat.listStats({
        followingIds: [self.user.id],
        limit: 10,
        cursor: toDateStringUTC(new Date("2024-01-10")),
      });
      expect(selfStats.results).toEqual({});

      const otherStats = await self.trpc.stat.listStats({
        followingIds: [other.user.id],
        limit: 10,
        cursor: toDateStringUTC(new Date("2024-01-10")),
      });
      expect(otherStats.results).toEqual({});
    }
  });
});
