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
import { Hexagon } from "@buds/app/tracks/components";

type StatList = RouterOutputs["stat"]["listStats"];
type FollowingList = RouterOutputs["user"]["listFollowing"];
type User = FollowingList[0];
type Track = FollowingList[0]["tracks"][0];
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

const trackIcons: Record<string, string> = {
  alcohol: "🍺",
  weight: "⚖️",
  mood: "🙂",
  food: "🍔",
  gym: "🏋️",
  pushups: "🤗",
  meditation: "☯",
};

const formatDate = (date: Date) => format(date, "E d");

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
  if (!value) {
    return undefined;
  }
  switch (trackName) {
    case "weight":
      const suffix = settings.measurements === "metric" ? "kg" : "lb";
      const display = convertWeight(
        value,
        "metric",
        settings.measurements,
      ).toFixed(1);
      return (
        <>
          <span>{display}</span>
          <span className="text-xs">{suffix}</span>
        </>
      );
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
      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-gray-50 after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rtl:peer-checked:after:-translate-x-full dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
      <span className="ms-3 text-sm font-medium">{label}</span>
    </label>
  );
};

type SortKey = {
  kind: "user" | "track";
  key: string;
  track: Track;
  user: User;
};

type SortKeyList = [outerKey: SortKey, innerKey: SortKey];
type KeyGroup = { sortKey: SortKey; childKeys: KeyGroup[] };

const compareKeyLists = (a: SortKeyList, b: SortKeyList): number => {
  const [aOuter, aInner] = a;
  const [bOuter, bInner] = b;
  return (
    aOuter.key.localeCompare(bOuter.key) || aInner.key.localeCompare(bInner.key)
  );
};

const groupEmUp = (sortKeyLists: SortKeyList[]): KeyGroup[] => {
  const ret: KeyGroup[] = [];
  for (const sortKeyList of sortKeyLists) {
    const [outerSortKey, innerSortKey] = sortKeyList;
    const prev = ret.pop();
    if (prev && prev.sortKey.key === outerSortKey.key) {
      prev.childKeys.push({ sortKey: innerSortKey, childKeys: [] });
      ret.push(prev);
    } else {
      prev && ret.push(prev);
      ret.push({
        sortKey: outerSortKey,
        childKeys: [{ sortKey: innerSortKey, childKeys: [] }],
      });
    }
  }
  return ret;
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

const UserHeader = ({
  user,
  colSpan,
  level,
}: {
  user: User;
  colSpan: number;
  level: 0 | 1;
}) => (
  <th key={user.id} colSpan={colSpan} className={level === 0 ? " " : ""}>
    <div className="flex items-center justify-center">
      <Avatar imageUrl={user.image} userName={user.name ?? "Anon"} />
    </div>
  </th>
);

const TrackHeader = ({
  track,
  colSpan,
  level,
}: {
  track: Track;
  colSpan: number;
  level: 0 | 1;
}) => (
  <th key={track.name} colSpan={colSpan} className={level === 0 ? " " : ""}>
    <div className="flex items-center justify-center">
      <Hexagon
        emoji={trackIcons[track.name] ?? "?"}
        hexagonColor="indigo-100"
      />
    </div>
  </th>
);

const Header = ({ keyGroup, level }: { keyGroup: KeyGroup; level: 0 | 1 }) => {
  switch (keyGroup.sortKey.kind) {
    case "track":
      return (
        <TrackHeader
          track={keyGroup.sortKey.track}
          colSpan={keyGroup.childKeys.length}
          level={level}
        />
      );
    case "user":
      return (
        <UserHeader
          user={keyGroup.sortKey.user}
          colSpan={keyGroup.childKeys.length}
          level={level}
        />
      );
  }
};

const Headers = ({
  level,
  keyGroups,
}: {
  level: 0 | 1;
  keyGroups: KeyGroup[];
}) => {
  const children: ReactNode[] = [];

  if (level === 0) {
    keyGroups.forEach((keyGroup, idx) => {
      const isLast = idx === keyGroups.length - 1;
      children.push(<Header keyGroup={keyGroup} level={level} />);
      if (!isLast) {
        children.push(<Spacer key={`spacer-${idx}`} type="th" />);
      }
    });
  } else if (level === 1) {
    keyGroups.forEach((outerKeyGroup, idx) => {
      const isLast = idx === keyGroups.length - 1;
      outerKeyGroup.childKeys.forEach((keyGroup) => {
        children.push(<Header keyGroup={keyGroup} level={level} />);
      });
      if (!isLast) {
        children.push(<Spacer key={`spacer-${idx}`} type="th" />);
      }
    });
  }

  return <>{children}</>;
};

export default function Home() {
  return (
    <UserSettingProvider>
      <TrackList />
    </UserSettingProvider>
  );
}

const accessor = (
  sl: StatList,
  userId: string,
  trackName: string,
  offset: number,
): number | undefined => {
  return sl?.stats?.[userId]?.[trackName]?.data[offset] ?? undefined;
};

export function TrackList() {
  const { settings, setUserSettings } = useContext(UserSettingsContext);

  const displayMetric = settings.measurements === "metric";

  const setDisplayMetric = (useMetric: boolean) =>
    setUserSettings({
      ...settings,
      measurements: useMetric ? "metric" : "imperial",
    });

  const toggleStarHeart = (useStar: boolean) =>
    setUserSettings({
      ...settings,
      checkIcon: useStar ? "⭐" : "💖",
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

  const sortKeys: SortKeyList[] = [];

  for (const user of sliced) {
    for (const track of user.tracks) {
      const userKey: SortKey = {
        kind: "user",
        key: `${user.name ?? "Anon"}-${user.id}`,
        user: user,
        track: track,
      };
      const trackKey: SortKey = {
        kind: "track",
        key: track.name,
        user: user,
        track: track,
      };
      sortKeys.push(
        groupBy === "user" ? [userKey, trackKey] : [trackKey, userKey],
      );
    }
  }

  sortKeys.sort(compareKeyLists);
  const keyGroups = groupEmUp(sortKeys);

  const numRows = differenceInDays(stats.end, stats.start) - 1;
  const rowsMap = Array.from(new Array(numRows));

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-bl from-[#FED5B6] to-[#7371B5] font-light text-gray-600">
      <div>
        <ToggleButton
          value={groupByUser}
          onChange={setGroupByUser}
          label="Track/User"
        />
      </div>
      <div>
        <ToggleButton
          value={settings.checkIcon === "⭐"}
          onChange={toggleStarHeart}
          label="💖/⭐"
        />
      </div>
      <div>
        <ToggleButton
          value={displayMetric}
          onChange={setDisplayMetric}
          label="Use metric?"
        />
      </div>
      <div className="mb-12 mt-8 rounded-lg bg-gray-50 py-4 shadow-xl drop-shadow-xl">
        <table>
          <thead className="bg-gray-50 bg-opacity-30 backdrop-blur-md">
            <tr>
              <th></th>
              <Headers level={0} keyGroups={keyGroups} />
            </tr>
            <tr>
              <th>Nov 23</th>
              <Headers level={1} keyGroups={keyGroups} />
            </tr>
          </thead>
          <tbody>
            {rowsMap.map((_, dateOffset) => {
              const date = subDays(stats.end, dateOffset);
              const isWeekend = isSaturday(date) || isSunday(date);
              const children: ReactNode[] = [];

              keyGroups.forEach((outerKeyGroup, i) => {
                const last = i === keyGroups.length - 1;
                outerKeyGroup.childKeys.forEach((keyGroup) => {
                  const sk = keyGroup.sortKey;
                  const value = accessor(
                    stats,
                    sk.user.id,
                    sk.track.name,
                    dateOffset,
                  );
                  // TODO: Make a TD component
                  children.push(
                    <td
                      key={`${sk.user.id}-${sk.track.name}`}
                      className={`h-[45px] min-w-[70px] text-center`}
                    >
                      <CellValue trackName={sk.track.name} value={value} />
                    </td>,
                  );
                });
                if (!last) {
                  children.push(<Spacer key={`spacer-${i}`} type="td" />);
                }
              });

              return (
                <tr
                  key={`${dateOffset}`}
                  className={isWeekend ? "bg-gray-100" : ""}
                >
                  <td className="px-2 text-right">{formatDate(date)}</td>
                  {children}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}

const Spacer = ({ type }: { type: "th" | "td" }) => {
  const className = `h-[45px] min-w-[70px] text-center`;
  return type === "th" ? <th {...{ className }} /> : <td {...{ className }} />;
};
