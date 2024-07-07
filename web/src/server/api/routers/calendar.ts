import { Prisma, PrismaClient } from "@prisma/client";

type Entry = {
  date: Date;
  name: string;
  scheduled: boolean;
  value: number | null;
  userId: string;
};

export async function calendarView(
  prisma: PrismaClient,
  userIds: string[],
  start: Date,
  end: Date,
) {
  const result = await prisma.$queryRaw<Entry[]>`
    WITH date_series AS (SELECT generate_series(${start}::date, ${end}::date, '1 day') AS "date"),
         "calendar" AS (SELECT "date", EXTRACT(DOW FROM "date") dow FROM "date_series" ORDER BY "date" DESC),
         "schedules" AS (SELECT c."date"::date,
                                c.dow,
                                t.name,
                                s.*,
                                ROW_NUMBER()
                                OVER (PARTITION BY s."trackId", s."userId", c."date" ORDER BY s."createdAt" DESC)::int AS "row_num"
                         FROM "calendar" c
                                  JOIN "Schedule" s ON (s."effectiveFrom" <= c."date") AND
                                                       (s."effectiveTo" IS NULL OR s."effectiveTo" >= c."date")
                                  JOIN "Track" t on s."trackId" = t.id
                         ORDER BY c."date" DESC),
         "effective_schedules" AS (SELECT *
                                   from "schedules"
                                   WHERE row_num = '1'),
    
    
    -- This gives us the most useful view of the entries, joined with the schedule so
    -- that you can see, for every day in the time-period whether an entry was required
    -- and what the entry actually is.
         "entries" As (select es.date,
                              es.dow,
                              CASE
                                  WHEN es.dow = 0 AND sunday = 't' THEN true
                                  WHEN es.dow = 1 AND monday = 't' THEN true
                                  WHEN es.dow = 2 AND tuesday = 't' THEN true
                                  WHEN es.dow = 3 AND wednesday = 't' THEN true
                                  WHEN es.dow = 4 AND thursday = 't' THEN true
                                  WHEN es.dow = 5 AND friday = 't' THEN true
                                  WHEN es.dow = 6 AND saturday = 't' THEN true
                                  ELSE false
                                  END AS
                                  scheduled,
                              es.name,
                              s.value,
                              es."userId",
                              es.monday,
                              es.tuesday,
                              es.wednesday,
                              es.thursday,
                              es.friday,
                              es.saturday,
                              es.sunday
                       from effective_schedules es
                                left join "Stat" s on es."trackId" = s."trackId" and es.date = s.date
                       where es."userId" IN (${Prisma.join(userIds)})
                       order by es.date desc)
    
    
    -- This aggregation gives you the number of entries were required in the
    -- time-period (ie. the goal) and the number actually completed.
    -- SELECT name,
    --        COUNT(CASE WHEN scheduled = 't' THEN 1 END)::int                       AS goal,
    --        COUNT(CASE WHEN scheduled = 't' AND value IS NOT NULL THEN 1 END)::int AS completed
    -- FROM entries e
    -- GROUP BY name
    -- ORDER BY name;
    
    SELECT * FROM "entries";
  `;

  return result.map((r) => ({
    date: r.date,
    trackName: r.name,
    scheduled: r.scheduled,
    value: r.value,
    userId: r.userId,
  }));
}
