"use client";

import { api } from "@buds/trpc/react";
import {
  differenceInDays,
  format,
  isSaturday,
  isSunday,
  subDays,
} from "date-fns";
import { RouterOutputs } from "@buds/trpc/shared";
import { createContext, ReactNode, useContext, useState } from "react";

type StatList = RouterOutputs["stat"]["listStats"];
type FollowingList = RouterOutputs["user"]["listFollowing"];
type User = FollowingList[0];
type Track = FollowingList[0]["tracks"][0];
type AccessorReturn = [trackName: string, value: number | undefined];
type RowAccessor = (sl: StatList, offset: number) => AccessorReturn;
type Grouper = [
  userSortKey: string,
  trackSortKey: string,
  User,
  Track,
  RowAccessor,
];
type GroupBy = "user" | "track";
type Measurement = "metric" | "imperial";

type UserSettings = {
  measurements: Measurement;
  checkIcon: string;
};
const defaultUserSettings: UserSettings = {
  measurements: "metric",
  checkIcon: "⭐",
};

type UserSettingsContextType = {
  settings: UserSettings;
  setUserSettings: (settings: UserSettings) => void;
};
const defaultUserSettingsContext = {
  settings: defaultUserSettings,
  setUserSettings: () => {
    return;
  },
};
const UserSettingsContext = createContext<UserSettingsContextType>(
  defaultUserSettingsContext,
);

const UserSettingProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setUserSettings] =
    useState<UserSettings>(defaultUserSettings);
  return (
    <UserSettingsContext.Provider value={{ settings, setUserSettings }}>
      {children}
    </UserSettingsContext.Provider>
  );
};

const trackIcons: { [trackName: string]: string } = {
  alcohol: "🍺",
  weight: "⚖️",
  mood: "🙂",
  food: "🍔",
  gym: "🏋️",
  pushups: "🤗",
  meditation: "☯",
};

const formatDate = (date: Date) => format(date, "P");

const cmp = (a: string, b: string): number => {
  if (a === b) {
    return 0;
  } else if (a < b) {
    return -1;
  } else {
    return 1;
  }
};

const convertWeight = (val: number, from: Measurement, to: Measurement) => {
  let multiplier = 1;
  if (from == "metric" && to === "imperial") {
    multiplier = 2.20462;
  } else if (from == "imperial" && to === "metric") {
    multiplier = 0.453592;
  }
  return val * multiplier;
};

const CellValue = ({
  trackName,
  value,
}: {
  trackName: string;
  value: number | undefined;
}) => {
  const { settings } = useContext(UserSettingsContext);
  switch (trackName) {
    case "weight":
      const suffix = settings.measurements === "metric" ? "kg" : "lb";
      const display = value
        ? convertWeight(value, "metric", settings.measurements).toFixed(1)
        : "";
      return value ? `${display} ${suffix}` : value;
    case "food":
    case "gym":
      return value === 1 ? settings.checkIcon : undefined;
    case "mood":
    default:
      return value;
  }
};

const ToggleButton = ({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) => {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input
        type="checkbox"
        checked={value}
        className="peer sr-only"
        onChange={() => onChange(!value)}
      />
      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rtl:peer-checked:after:-translate-x-full dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
      <span className="ms-3 text-sm font-medium">{label}</span>
    </label>
  );
};

const sortByUser = (a: Grouper, b: Grouper): number => {
  const [userKeyA, trackKeyA, ...restA] = a;
  const [userKeyB, trackKeyB, ...restB] = b;
  const outerCmp = cmp(userKeyA, userKeyB);
  return outerCmp === 0 ? cmp(trackKeyA, trackKeyB) : outerCmp;
};

const sortByTrack = (a: Grouper, b: Grouper): number => {
  const [userKeyA, trackKeyA, ...restA] = a;
  const [userKeyB, trackKeyB, ...restB] = b;
  const outerCmp = cmp(trackKeyA, trackKeyB);
  return outerCmp === 0 ? cmp(userKeyA, userKeyB) : outerCmp;
};

const Header = ({ show, grouper }: { show: GroupBy; grouper: Grouper }) => {
  const user = grouper[2];
  const track = grouper[3];

  switch (show) {
    case "track":
      return <th key={track.id}>{trackIcons[track.name] ?? track.name}</th>;
    case "user":
      return <th key={user.id}>{user.name ?? "Anon"}</th>;
  }
};

export default function Home() {
  return (
    <UserSettingProvider>
      <TrackList />
    </UserSettingProvider>
  );
}

export function TrackList() {
  const { settings, setUserSettings } = useContext(UserSettingsContext);

  const displayMetric = settings.measurements === "metric";
  const setDisplayMetric = (useMetric: boolean) =>
    setUserSettings({
      ...settings,
      measurements: useMetric ? "metric" : "imperial",
    });

  const [groupByUser, setGroupByUser] = useState<boolean>(true);

  const groupBy: GroupBy = groupByUser ? "user" : "track";

  const { data: following } = api.user.listFollowing.useQuery();

  const { data: stats } = api.stat.listStats.useQuery(
    {
      followingIds: (following ?? []).map((f) => f.id),
    },
    { enabled: !!following },
  );

  if (!(following && stats)) {
    return <div>Loading</div>;
  }

  // TODO: This limits the number of buddies displayed, remove!
  const sliced = following.slice(0, 3);

  const groupers: Grouper[] = [];

  sliced.forEach((user) => {
    user.tracks.forEach((track) => {
      const accessor = (sl: StatList, offset: number): AccessorReturn => {
        const value =
          sl?.stats?.[user.id]?.[track.name]?.data[offset] ?? undefined;
        return [track.name, value];
      };
      groupers.push([
        `${user.name ?? ""}-${user.id}`,
        track.name,
        user,
        track,
        accessor,
      ]);
    });
  });

  const sortFunc = groupBy === "user" ? sortByUser : sortByTrack;
  groupers.sort(sortFunc);

  const numRows = differenceInDays(stats.end, stats.start);
  const rowsMap = Array.from(new Array(numRows));

  const l1Header = groupBy;
  const l2Header = groupBy === "user" ? "track" : "user";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <h1>Buddies</h1>
      <div>
        <ToggleButton
          value={groupByUser}
          onChange={setGroupByUser}
          label="Track/User"
        />
      </div>
      <div>
        <ToggleButton
          value={displayMetric}
          onChange={setDisplayMetric}
          label="Use metric?"
        />
      </div>
      <table>
        <thead>
          <tr>
            <th></th>
            {groupers.map((gr, idx) => (
              <Header key={`${gr[0]}-${idx}`} show={l1Header} grouper={gr} />
            ))}
          </tr>
          <tr>
            <th>Date</th>
            {groupers.map((gr, idx) => (
              <Header key={`${gr[0]}-${idx}`} show={l2Header} grouper={gr} />
            ))}
          </tr>
        </thead>
        <tbody>
          {rowsMap.map((_, dateOffset) => {
            const date = subDays(stats.end, dateOffset);
            const isWeekend = isSaturday(date) || isSunday(date);
            return (
              <tr
                key={`${dateOffset}`}
                className={isWeekend ? "bg-blue-800" : ""}
              >
                <td>{formatDate(date)}</td>
                {groupers.map((grouper, columnOffset) => {
                  const accessor = grouper[4];
                  const [trackName, value] = accessor(stats, dateOffset);
                  return (
                    <td key={`${dateOffset}-${columnOffset}`}>
                      <CellValue trackName={trackName} value={value} />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
