import { test } from "vitest";
import { mkUser, trpcCaller } from "@buds/test-utils";

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
