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
  checkIcon: "💖",
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

const trackIcons: Record<string, string> = {
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

interface AvatarProps {
  imageUrl?: string | null;
  userName: string;
}

const Avatar: React.FC<AvatarProps> = ({ imageUrl, userName }) => {
  const getInitials = (name: string): string => {
    const nameArray = name.split(" ");
    return nameArray
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
  };

  return (
    <div className="h-12 w-12 overflow-hidden rounded-full">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={userName}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-300 text-lg font-bold text-gray-600">
          {getInitials(userName)}
        </div>
      )}
    </div>
  );
};

const UserHeaders = ({ groupers }: { groupers: Grouper[] }) => {
  type User = Grouper[2];
  type ColSpan = [User, number];

  const colSpans: ColSpan[] = [];

  groupers.forEach((gr: Grouper) => {
    const curr = gr[2];
    const prev = colSpans.pop();
    if (prev?.[0]?.id === curr.id) {
      colSpans.push([prev[0], prev[1] + 1]);
    } else {
      prev && colSpans.push(prev);
      colSpans.push([curr, 1]);
    }
  });

  return colSpans.map(([user, colSpan]) => (
    <th key={user.id} colSpan={colSpan}>
      <div className="flex items-center justify-center">
        <Avatar imageUrl={user.image} userName={user.name ?? "Anon"} />
      </div>
    </th>
  ));
};

const TrackHeaders = ({ groupers }: { groupers: Grouper[] }) => {
  type Track = Grouper[3];
  type ColSpan = [Track, number];

  const colSpans: ColSpan[] = [];

  groupers.forEach((gr: Grouper) => {
    const curr = gr[3];
    const prev = colSpans.pop();
    if (prev?.[0]?.name === curr.name) {
      colSpans.push([prev[0], prev[1] + 1]);
    } else {
      prev && colSpans.push(prev);
      colSpans.push([curr, 1]);
    }
  });

  return colSpans.map(([track, colSpan]) => (
    <th key={track.name} colSpan={colSpan} className="text-center">
      {trackIcons[track.name] ?? track.name}
    </th>
  ));
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

  const userHeaders = <UserHeaders groupers={groupers} />;
  const trackHeaders = <TrackHeaders groupers={groupers} />;
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
            {groupBy === "user" ? userHeaders : trackHeaders}
          </tr>
          <tr>
            <th>Date</th>
            {groupBy === "user" ? trackHeaders : userHeaders}
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
                    <td
                      key={`${dateOffset}-${columnOffset}`}
                      className="min-w-[70px] text-center"
                    >
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
