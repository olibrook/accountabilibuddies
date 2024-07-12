import { z } from "zod";
import { format, parseISO } from "date-fns";

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

export const toDateStringUTC = (d: Date): DateString => {
  const year = d.getUTCFullYear();
  const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = d.getUTCDate().toString().padStart(2, "0");
  const dateString = `${year}-${month}-${day}`;
  return ZDateString.parse(dateString);
};

export const toDateStringLocal = (d: Date): DateString => {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const dateString = `${year}-${month}-${day}`;
  return ZDateString.parse(dateString);
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

export type MeasurementPreference = { useMetric: boolean };
export const getMeasurement = (user: MeasurementPreference): Measurement => {
  switch (user.useMetric) {
    case true:
      return "metric";
    case false:
      return "imperial";
  }
};

export const isWeekend = (ds: DateString) => {
  const date = new Date(ds);
  const day = date.getUTCDay();
  return day === 0 || day === 6;
};

export const $log = (x: any) => console.log(JSON.stringify(x, null, 2));

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function randomFromSeed(seedString: string, range: number): number {
  return Math.round(seededRandom(stringToSeed(seedString)) * range) + 1;
}

export const formatFullDate = (date: DateString) =>
  format(parseISO(date), "PPP");
