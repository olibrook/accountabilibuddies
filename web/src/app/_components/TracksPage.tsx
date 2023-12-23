"use client";

import { api } from "@buds/trpc/react";
import {
  differenceInDays,
  endOfDay,
  format,
  isSaturday,
  isSunday,
  startOfDay,
  subDays,
} from "date-fns";
import { RouterOutputs } from "@buds/trpc/shared";
import React, { ReactNode, useContext, useMemo, useState } from "react";
import AppShell, {
  Measurement,
  UserSettings,
  UserSettingsContext,
} from "@buds/app/_components/AppShell";
import Link from "next/link";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DefaultSession } from "next-auth";
import { SessionContextValue } from "next-auth/src/react";
import { NumberInput } from "@buds/app/_components/NumberInput";

type StatList = RouterOutputs["stat"]["listStats"];
type FollowingList = RouterOutputs["user"]["listFollowing"];
type User = FollowingList[0];
type Track = FollowingList[0]["tracks"][0];
type GroupBy = "user" | "track";

type TrackConfig = {
  icon: string;
  name: string;
  units: string;
  type: "binary" | "number";
  incr: number;
  min: number | undefined;
  max: number | undefined;
};

type TrackName =
  | "alcohol"
  | "weight"
  | "mood"
  | "food"
  | "gym"
  | "pushups"
  | "meditation";

const trackConfigs: Record<TrackName, TrackConfig> = {
  alcohol: {
    icon: "🍺",
    name: "Alcohol",
    units: "sober days",
    type: "binary",
    incr: 0,
    min: 0,
    max: 1,
  },
  weight: {
    icon: "⚖️",
    name: "Weight",
    units: "", // user-defined
    type: "number",
    incr: 0.1,
    min: 0,
    max: undefined,
  },
  mood: {
    icon: "🙂",
    name: "Mood",
    units: "nuggets",
    type: "number",
    incr: 1,
    min: 0,
    max: 10,
  },
  food: {
    icon: "🍔",
    name: "Food",
    units: "clean days",
    type: "binary",
    incr: 0,
    min: 0,
    max: 1,
  },
  gym: {
    icon: "🏋️",
    name: "Gym",
    units: "lift days",
    type: "binary",
    incr: 0,
    min: 0,
    max: 1,
  },
  pushups: {
    icon: "🤗",
    name: "Pushups",
    units: "grunts",
    type: "binary",
    incr: 0,
    min: 0,
    max: 1,
  },
  meditation: {
    icon: "☯",
    name: "Meditation",
    units: "oms",
    type: "binary",
    incr: 0,
    min: 0,
    max: 1,
  },
};

const formatDate = (date: Date) => format(date, "E d");
const formatFullDate = (date: Date) => format(date, "PPP");

const convertWeight = (val: number, from: Measurement, to: Measurement) => {
  let multiplier = 1;
  if (from == "metric" && to === "imperial") {
    multiplier = 2.20462;
  } else if (from == "imperial" && to === "metric") {
    multiplier = 0.453592;
  }
  return val * multiplier;
};

const InteractiveCell = ({
  session,
  date,
  keyGroup,
  children,
  setEditing,
  value,
  previousValue,
}: {
  session: CustomSession;
  date: Date;
  keyGroup: KeyGroup;
  children: ReactNode;
  setEditing: (e: Editing | undefined) => void;
  value: number | undefined;
  previousValue: number | undefined;
}) => {
  const onClick = (e: MouseEvent) => {
    e.preventDefault();
    const trackName = keyGroup.sortKey.track.name as TrackName;
    const trackConfig = trackConfigs[trackName];
    if (trackConfig.type === "number") {
      setEditing({ date, keyGroup, value, previousValue });
    } else {
      console.log(`Update a binary value here`);
      console.log({ date, value: !value ? 1 : 0, trackName });
    }
  };
  const isMe = keyGroup.sortKey.user.id === session.user.id;
  const props = {
    onClick: onClick,
  };
  const { onClick: _, ...disabledProps } = props;
  const finalProps = isMe ? props : disabledProps;
  return <span {...finalProps}>{children}</span>;
};

const CellValue = ({
  trackName,
  value,
}: {
  trackName: string;
  value?: number;
}) => {
  const { settings } = useContext(UserSettingsContext);
  if (!value) {
    return <span className="text-gray-300">⚬</span>;
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
  size: "xl" | "lg" | "md";
};

type IconProps = {
  imageUrl?: string | null;
  fallback: string;
  alt: string;
} & Sized;

const Icon: React.FC<IconProps> = ({ imageUrl, alt, fallback, size }) => {
  const sizeStyles =
    size === "md" ? "h-8 w-8" : "lg" ? "h-10 w-10" : "h-14 w-14";
  return (
    <div className={`${sizeStyles} overflow-hidden rounded-full`}>
      {imageUrl ? (
        <img src={imageUrl} alt={alt} className="h-full w-full object-cover" />
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
    <Icon
      imageUrl={imageUrl}
      alt={userName}
      fallback={getInitials(userName)}
      size={size}
    />
  );
};

const UserAvatar = ({ user, size }: { user: User; size: "md" | "lg" }) => (
  <Avatar imageUrl={user.image} userName={user.name ?? "Anon"} size={size} />
);

const KeyGroupIcon = ({
  keyGroup,
  size,
}: {
  keyGroup: KeyGroup;
  size: "md" | "lg";
}) => {
  const href = hrefForKeyGroup(keyGroup);
  switch (keyGroup.sortKey.kind) {
    case "track":
      const track = keyGroup.sortKey.track;
      const trackConfig = trackConfigs[track.name as TrackName];
      return (
        <Link href={href}>
          <Icon
            fallback={trackConfig.icon ?? "?"}
            alt={trackConfig.name ?? "?"}
            size={size}
          />
        </Link>
      );

    case "user":
      const user = keyGroup.sortKey.user;
      return (
        <Link href={href}>
          <UserAvatar user={user} size={size} />
        </Link>
      );
  }
};

const KeyGroupName = ({ keyGroup }: { keyGroup: KeyGroup }) => {
  switch (keyGroup.sortKey.kind) {
    case "track":
      const trackConfig =
        trackConfigs[keyGroup.sortKey.track.name as TrackName];
      return trackConfig.name;
    case "user":
      return keyGroup.sortKey.user.name ?? "Anon";
  }
};

type Params = { trackName?: string; userId?: string };

export const TracksPage = ({ params }: { params: Params }) => {
  return (
    <SessionProvider>
      <AppShell>
        <TrackListWrapper params={params} />
      </AppShell>
    </SessionProvider>
  );
};

const accessor = (
  sl: StatList,
  userId: string,
  trackName: string,
  offset: number,
): number | undefined => {
  return sl?.stats?.[userId]?.[trackName]?.data[offset] ?? undefined;
};

const hrefForKeyGroup = (kg: KeyGroup) => {
  switch (kg.sortKey.kind) {
    case "track":
      return `/tracks/${kg.sortKey.track.name}`;
    case "user":
      return `/users/${kg.sortKey.user.id}`;
  }
};

type AuthdSession = Extract<
  SessionContextValue<true>,
  { status: "authenticated" }
>;

interface CustomSession extends DefaultSession {
  user: {
    id: string;
  } & DefaultSession["user"];
}

function TrackListWrapper({ params }: { params: Params }) {
  const session = useSession();

  if (session.data) {
    // TODO: This is horrendous – how do we get the type properly on
    //  the client through next-auth?
    const custom = session.data as unknown as CustomSession;
    return <TrackList session={custom} params={params} />;
  } else {
    return null;
  }
}

type Editing = {
  keyGroup: KeyGroup;
  date: Date;
  value: number | undefined;
  previousValue: number | undefined;
};

function TrackList({
  params: { trackName, userId: userIdFromParams },
  session,
}: {
  params: Params;
  session: CustomSession;
}) {
  const router = useRouter();

  const [editing, setEditing] = useState<Editing | undefined>();

  const { data: following } = api.user.listFollowing.useQuery();

  const { data: stats } = api.stat.listStats.useQuery(
    {
      followingIds: (following ?? []).map((f) => f.id),
      start: startOfDay(subDays(new Date(), 30)),
      end: endOfDay(new Date()),
    },
    { enabled: !!following },
  );

  const userId = userIdFromParams === "me" ? session.user.id : userIdFromParams;

  const groupBy: GroupBy = !!userId ? "user" : "track";

  const keyGroups = useMemo(() => {
    const sortKeys: SortKeyList[] = [];

    for (const user of following ?? []) {
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

  if (!trackName && !userId) {
    router.replace("/users/me");
  }

  if (!(following && stats)) {
    return <div>Loading</div>;
  }

  const numRows = differenceInDays(stats.end, stats.start) - 1;
  const rowsMap = Array.from(new Array(numRows));

  let selectedKeyGroup: KeyGroup | undefined;

  switch (groupBy) {
    case "user":
      selectedKeyGroup = keyGroups.find((kg) => kg.sortKey.user.id === userId);
      break;
    case "track":
      selectedKeyGroup = keyGroups.find(
        (kg) => kg.sortKey.track.name === trackName,
      );
      break;
  }

  if (!selectedKeyGroup) {
    return null;
  }

  return (
    <main className={`h-screen px-4 pb-16 pt-14 font-light text-gray-600`}>
      <div className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-[#7371b5] shadow-xl drop-shadow-xl">
        {editing ? (
          <EntryPopup editing={editing} setEditing={setEditing} />
        ) : null}
        <div className="flex flex-1 items-center justify-end p-4 font-normal text-white">
          <KeyGroupName keyGroup={selectedKeyGroup} />
          <span className="ml-4">
            <KeyGroupIcon keyGroup={selectedKeyGroup} size="lg" />
          </span>
        </div>
        <div className="w-full flex-grow overflow-scroll rounded-b-xl bg-gray-50">
          <table className="min-w-full">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="font-normal">
                <th className="py-2 text-right">
                  <div className="w-[70px]">Nov 23</div>
                </th>
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
                    <td className="w-[70px] text-right text-sm">
                      <div>{formatDate(date)}</div>
                    </td>
                    {selectedKeyGroup.childKeys.map((keyGroup) => {
                      const sk = keyGroup.sortKey;
                      const value = accessor(
                        stats,
                        sk.user.id,
                        sk.track.name,
                        dateOffset,
                      );
                      const previousValue = accessor(
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
                          <InteractiveCell
                            date={date}
                            keyGroup={keyGroup}
                            session={session}
                            setEditing={setEditing}
                            previousValue={previousValue}
                            value={value}
                          >
                            <CellValue
                              trackName={sk.track.name}
                              value={value}
                            />
                          </InteractiveCell>
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

      <nav className="fixed bottom-0 left-0 z-10 w-full bg-gray-600 bg-opacity-30 p-2 text-xs">
        <div className="flex w-full overflow-scroll">
          {keyGroups.map((kg) => {
            return (
              <div
                key={`${kg.sortKey.user.id}-${kg.sortKey.track.name}`}
                className="mx-1"
              >
                <KeyGroupIcon keyGroup={kg} size="lg" />
              </div>
            );
          })}
        </div>
      </nav>
    </main>
  );
}

const getUnit = (userSettings: UserSettings, trackName: string) => {
  if (trackName === "weight") {
    return userSettings.measurements === "metric" ? "Kg" : "lb";
  } else {
    const trackConfig = trackConfigs[trackName as TrackName];
    return trackConfig.units;
  }
};

const EntryPopup = ({
  editing,
  setEditing,
}: {
  editing: Editing;
  setEditing: (e: Editing | undefined) => void;
}) => {
  const userSettingsContext = useContext(UserSettingsContext);
  const [value, setValue] = useState<number | undefined>(
    editing.value ?? editing.previousValue,
  );
  const { date, keyGroup } = editing;
  const trackConfig = trackConfigs[keyGroup.sortKey.track.name as TrackName];
  const trackName = trackConfig.name ?? "?";
  const trackEmoji = trackConfig.icon ?? "?";
  const icon = trackEmoji ? (
    <Icon fallback={trackEmoji} alt={trackEmoji} size={"xl"} />
  ) : (
    false
  );
  const unit = getUnit(
    userSettingsContext.settings,
    keyGroup.sortKey.track.name,
  );

  return (
    <div className="absolute bottom-0 left-0 right-0 top-0 z-50  bg-gray-100">
      <div className="flex h-full flex-col items-center justify-center px-4">
        <div className="mb-4 flex w-full flex-row items-end justify-end">
          <div className="mr-4 text-right">
            <h2 className="text-lg font-medium">{trackName}</h2>
            <h3 className="text-sm font-light">{formatFullDate(date)}</h3>
          </div>
          {icon}
        </div>
        <div className="mb-2">
          <NumberInput
            value={value}
            onChange={setValue}
            min={trackConfig.min}
            max={trackConfig.max}
            incr={trackConfig.incr}
            unit={unit}
          />
        </div>
        <button
          type="button"
          className="rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          onClick={() => {
            console.log("Update this:");
            console.log({ date, value, trackName });
            setEditing(undefined);
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
};
