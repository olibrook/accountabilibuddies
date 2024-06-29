import { z } from "zod";
import { CustomSession } from "@buds/app/_components/TracksPage";
import { CurrentUser } from "@buds/app/_components/AppShell";

export type Measurement = "metric" | "imperial";

export type DateString = string & { __brand: "DateString" };

export const ZDateString = z
  .string()
  .refine(
    (val) => {
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      if (!regex.test(val)) return false;
      const date = new Date(val);
      if (isNaN(date.getTime())) return false;
      return true;
    },
    {
      message: `Invalid date format. Expected YYYY-MM-DD`,
    },
  )
  .transform((val) => val as DateString);

export const toDate = (ds: DateString): Date => {
  const d = new Date(ds);
  if (isNaN(d.getTime())) {
    throw new Error("Invalid date");
  }
  return d;
};

export const toDateString = (d: Date): DateString => {
  const year = d.getUTCFullYear();
  const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = d.getUTCDate().toString().padStart(2, "0");
  const dateString = `${year}-${month}-${day}`;
  return ZDateString.parse(dateString);
};

export const userIsOnboarded = (session?: CustomSession) => {
  return Boolean(session?.user.username);
};

export const convertWeight = (
  val: number,
  from: Measurement,
  to: Measurement,
) => {
  let multiplier = 1;
  if (from == "metric" && to === "imperial") {
    multiplier = 2.20462;
  } else if (from == "imperial" && to === "metric") {
    multiplier = 0.453592;
  }
  return val * multiplier;
};

export const getMeasurement = (user: CurrentUser): Measurement => {
  switch (user.useMetric) {
    case true:
      return "metric";
    case false:
      return "imperial";
  }
};
