import { describe, test } from "vitest";
import { mkUser, trpcCaller } from "@buds/test-utils";
import { v4 as uuid4 } from "uuid";
import { toDateStringUTC } from "@buds/shared/utils";
import { addDays } from "date-fns";
import { db } from "@buds/server/db";
import { calendarView } from "@buds/server/api/routers/calendar";

describe("Creating Tracks", () => {
  test("When creating modifying a track's schedule, build a history that allows the schedule to vary over time", async () => {
    const user = await mkUser();
    const trpc = await trpcCaller(user);

    expect((await trpc.track.list({ userId: user.id })).length).toBe(0);

    const now = new Date("2024-02-10");
    const enthusasticStart = addDays(now, -4);
    const lessEnthusiasticUpdate = addDays(now, -2);

    const data = {
      id: uuid4(),
      name: "weight-loss",
      schedules: [
        {
          effectiveFrom: toDateStringUTC(enthusasticStart),
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: true,
          sunday: true,
        },
      ],
    };

    await trpc.track.upsert(data);

    const tracks = await trpc.track.list({ userId: user.id });
    expect(tracks.map((t) => t.id)).toEqual([data.id]);

    const retrieved = tracks[0];
    expect(retrieved).toMatchObject(data);

    const updateData = {
      ...data,
      schedules: [
        {
          effectiveFrom: toDateStringUTC(lessEnthusiasticUpdate),
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
        },
      ],
    };
    await trpc.track.upsert(updateData);

    const tracks2 = await trpc.track.list({ userId: user.id });
    expect(tracks2.map((t) => t.id)).toEqual([data.id]);

    const retrieved2 = tracks2[0];
    expect(retrieved2).toMatchObject(updateData);

    const completeTrack = await db.track.findUnique({
      where: { id: data.id },
      select: {
        id: true,
        name: true,
        schedules: {
          select: {
            effectiveFrom: true,
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: true,
            sunday: true,
          },
          orderBy: {
            effectiveFrom: "desc" as const,
          },
        },
      },
    });

    console.error(JSON.stringify(completeTrack, null, 2));

    // The schedule changes over time
    expect(completeTrack).toEqual({
      id: data.id,
      name: "weight-loss",
      schedules: [
        {
          effectiveFrom: lessEnthusiasticUpdate,
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
        },
        {
          effectiveFrom: enthusasticStart,
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: true,
          sunday: true,
        },
      ],
    });

    // And it's reflected in queries for the stat
    const stats = await calendarView(db, [user.id], enthusasticStart, now);
    expect(stats).toEqual([
      {
        date: new Date("2024-02-10T00:00:00.000Z"),
        scheduled: false,
        trackName: "weight-loss",
        userId: user.id,
        value: null,
      },
      {
        date: new Date("2024-02-09T00:00:00.000Z"),
        scheduled: false,
        trackName: "weight-loss",
        userId: user.id,
        value: null,
      },
      {
        date: new Date("2024-02-08T00:00:00.000Z"),
        scheduled: false,
        trackName: "weight-loss",
        userId: user.id,
        value: null,
      },
      {
        date: new Date("2024-02-07T00:00:00.000Z"),
        scheduled: true,
        trackName: "weight-loss",
        userId: user.id,
        value: null,
      },
      {
        date: new Date("2024-02-06T00:00:00.000Z"),
        scheduled: true,
        trackName: "weight-loss",
        userId: user.id,
        value: null,
      },
    ]);
  });
});
