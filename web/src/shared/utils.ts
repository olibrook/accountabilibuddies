import { z } from "zod";

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

  console.log(JSON.stringify({ dateString }));
  return ZDateString.parse(dateString);
};
