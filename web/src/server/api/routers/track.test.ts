import { test } from "vitest";
import { mkUser, trpcCaller } from "@buds/test-utils";
import { v4 as uuid4 } from "uuid";

test("Creating and listing tracks", async () => {
  const user = await mkUser();
  const trpc = await trpcCaller(user);

  const tracks = await trpc.track.list({ userId: user.id });
  expect(tracks.length).toBe(0);

  const data = {
    id: uuid4(),
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
  const track = await trpc.track.upsert(data);

  const tracks2 = await trpc.track.list({ userId: user.id });
  expect(tracks2.map((t) => t.id)).toEqual([track.id]);

  const retrieved = tracks2[0];
  expect(retrieved).toMatchObject(data);
});
