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
import { useContext, useMemo } from "react";
import AppShell, {
  Measurement,
  UserSettingsContext,
} from "@buds/app/components/AppShell";

type StatList = RouterOutputs["stat"]["listStats"];
type FollowingList = RouterOutputs["user"]["listFollowing"];
type User = FollowingList[0];
type Track = FollowingList[0]["tracks"][0];
type GroupBy = "user" | "track";

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

type Sized = {
  size: "lg" | "md";
};

type IconProps = {
  imageUrl?: string | null;
  fallback: string;
} & Sized;

const Icon: React.FC<IconProps> = ({ imageUrl, fallback, size }) => {
  const sizeStyles = size === "md" ? "h-8 w-8" : "h-10 w-10";
  return (
    <div className={`${sizeStyles} overflow-hidden rounded-full`}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={fallback}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-white text-lg font-normal text-gray-600">
          {fallback}
        </div>
      )}
    </div>
  );
};

type AvatarProps = {
  imageUrl?: string | null;
  userName: string;
} & Sized;

const Avatar: React.FC<AvatarProps> = ({ imageUrl, userName, size }) => {
  const getInitials = (name: string): string => {
    const nameArray = name.split(" ");
    return nameArray
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
  };
  return (
    <Icon imageUrl={imageUrl} fallback={getInitials(userName)} size={size} />
  );
};

const KeyGroupIcon = ({
  keyGroup,
  size,
}: {
  keyGroup: KeyGroup;
  size: "md" | "lg";
}) => {
  switch (keyGroup.sortKey.kind) {
    case "track":
      const track = keyGroup.sortKey.track;
      return <Icon fallback={trackIcons[track.name] ?? "?"} size={size} />;

    case "user":
      const user = keyGroup.sortKey.user;
      return (
        <Avatar
          imageUrl={user.image}
          userName={user.name ?? "Anon"}
          size={size}
        />
      );
  }
};

const KeyGroupName = ({ keyGroup }: { keyGroup: KeyGroup }) => {
  switch (keyGroup.sortKey.kind) {
    case "track":
      return keyGroup.sortKey.track.name;
    case "user":
      return keyGroup.sortKey.user.name ?? "Anon";
  }
};

export default function Home() {
  return (
    <AppShell>
      <TrackList />
    </AppShell>
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
  const { data: following } = api.user.listFollowing.useQuery();

  const { data: stats } = api.stat.listStats.useQuery(
    {
      followingIds: (following ?? []).map((f) => f.id),
    },
    { enabled: !!following },
  );

  const { settings } = useContext(UserSettingsContext);

  const groupBy: GroupBy = settings.groupByUser ? "user" : "track";

  // Wait, why is this not changing???
  console.log({ groupBy, groupByUser: settings.groupByUser });

  const keyGroups = useMemo(() => {
    // TODO: This limits the number of buddies displayed, remove!
    const sliced = (following ?? []).slice(0, 10);

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
    return groupEmUp(sortKeys);
  }, [following, groupBy]);

  if (!(following && stats)) {
    return <div>Loading</div>;
  }

  const numRows = differenceInDays(stats.end, stats.start) - 1;
  const rowsMap = Array.from(new Array(numRows));

  const selectedKeyGroup = keyGroups[0];

  if (!selectedKeyGroup) {
    return null;
  }

  return (
    <main className={`h-screen px-4 pb-16 pt-12 font-light text-gray-600`}>
      <div className="h-full w-full rounded-xl bg-[#7371b5] pb-4 shadow-xl drop-shadow-xl">
        <div className="flex items-center justify-end p-4 text-white">
          <KeyGroupName keyGroup={selectedKeyGroup} />
          <span className="ml-4">
            <KeyGroupIcon keyGroup={selectedKeyGroup} size="lg" />
          </span>
        </div>
        <div className="h-full w-full overflow-scroll bg-gray-50">
          <table className="">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="font-normal">
                <th className="py-2 text-right">Nov 23</th>
                {selectedKeyGroup.childKeys.map((kg) => (
                  <th
                    className="py-2"
                    key={`${kg.sortKey.user.id}-${kg.sortKey.track.name}`}
                  >
                    <div className="flex items-center justify-center">
                      <KeyGroupIcon keyGroup={kg} size="md" />
                    </div>
                  </th>
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
                    className={isWeekend ? "bg-gray-100" : ""}
                  >
                    <td className="min-w-[70px] px-2 text-right text-sm">
                      {formatDate(date)}
                    </td>
                    {selectedKeyGroup.childKeys.map((keyGroup) => {
                      const sk = keyGroup.sortKey;
                      const value = accessor(
                        stats,
                        sk.user.id,
                        sk.track.name,
                        dateOffset,
                      );
                      return (
                        <td
                          key={`${sk.user.id}-${sk.track.name}`}
                          className={`h-[45px] min-w-[50px] text-center`}
                        >
                          <CellValue trackName={sk.track.name} value={value} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

const Spacer = ({ type }: { type: "th" | "td" }) => {
  const className = `h-[45px] min-w-[70px] text-center`;
  return type === "th" ? <th {...{ className }} /> : <td {...{ className }} />;
};
