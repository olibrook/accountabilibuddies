"use client";

import { api } from "@buds/trpc/react";
import { format, isSaturday, isSunday, parseISO } from "date-fns";
import { RouterOutputs } from "@buds/trpc/shared";
import React, { ReactNode, useMemo, useRef, useState } from "react";
import AppShell, {
  CurrentUser,
  useCurrentUser,
} from "@buds/app/_components/AppShell";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DefaultSession } from "next-auth";
import { NumberInput } from "@buds/app/_components/NumberInput";
import InfiniteScroll from "react-infinite-scroll-component";
import { User } from "react-feather";
import DropdownMenu from "@buds/app/_components/DropdownMenu";
import { debounce } from "next/dist/server/utils";
import { Pane } from "@buds/app/_components/Pane";
import {
  convertWeight,
  DateString,
  getMeasurement,
  toDate,
  toDateString,
} from "@buds/shared/utils";

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

const formatMonthYear = (date: DateString) => format(parseISO(date), "MMM ’yy");
const formatDate = (date: DateString) => format(parseISO(date), "E d");
const formatFullDate = (date: DateString) => format(parseISO(date), "PPP");

const InteractiveCell = ({
  session,
  date,
  keyGroup,
  children,
  setEditing,
  value,
  previousValue,
  upsertStat,
}: {
  session: CustomSession;
  date: DateString;
  keyGroup: KeyGroup;
  children: ReactNode;
  setEditing: (e: Editing | undefined) => void;
  value: number | undefined;
  previousValue: number | undefined;
  upsertStat: ReturnType<typeof api.stat.upsertStat.useMutation>;
}) => {
  const onClick = async (e: MouseEvent) => {
    e.preventDefault();
    const trackName = keyGroup.sortKey.track.name as TrackName;
    const trackId = keyGroup.sortKey.track.id;
    const trackConfig = trackConfigs[trackName];
    if (trackConfig.type === "number") {
      setEditing({ date, keyGroup, value, previousValue });
    } else {
      const val = {
        date: date,
        value: !value ? 1 : 0,
        trackId,
      };
      await upsertStat.mutateAsync(val);
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
  const currentUser = useCurrentUser();
  if (!value) {
    return <span className="text-gray-300">⚬</span>;
  }
  switch (trackName) {
    case "weight":
      const suffix = currentUser.useMetric ? "kg" : "lb";
      const display = convertWeight(
        value,
        "metric",
        currentUser.useMetric ? "metric" : "imperial",
      ).toFixed(1);
      return (
        <>
          <span>{display}</span>
          <span className="text-xs">{suffix}</span>
        </>
      );
    case "food":
    case "gym":
      return value === 1 ? currentUser.checkMark : undefined;
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
export type KeyGroup = {
  sortKey: SortKey;
  childKeys: KeyGroup[];
};

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
  size: "4xl" | "xl" | "lg" | "md" | "s";
};

type IconProps = {
  imageUrl?: string | null;
  fallback: string;
  alt: string;
} & Sized;

export const Icon: React.FC<IconProps> = ({
  imageUrl,
  alt,
  fallback,
  size,
}) => {
  const sizeStyles = {
    "4xl": "h-[185px] w-[185px]",
    xl: "h-14 w-14",
    lg: "h-10 w-10",
    md: "h-8 w-8",
    s: "h-8 w-8",
  };
  return (
    <div className={`${sizeStyles[size]} overflow-hidden rounded-full border`}>
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

export const Avatar: React.FC<AvatarProps> = ({ imageUrl, userName, size }) => {
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

export const KeyGroupLink = ({
  keyGroup,
  size,
}: {
  keyGroup: KeyGroup;
  size: "md" | "lg";
}) => {
  const href = hrefForKeyGroup(keyGroup);
  return (
    <Link href={href}>
      <KeyGroupIcon keyGroup={keyGroup} size={size} />
    </Link>
  );
};

export const KeyGroupIcon = ({
  keyGroup,
  size,
}: {
  keyGroup: KeyGroup;
  size: "md" | "lg";
}) => {
  switch (keyGroup.sortKey.kind) {
    case "track":
      const track = keyGroup.sortKey.track;
      const trackConfig = trackConfigs[track.name as TrackName];
      return (
        <Icon
          fallback={trackConfig.icon ?? "?"}
          alt={trackConfig.name ?? "?"}
          size={size}
        />
      );

    case "user":
      const user = keyGroup.sortKey.user;
      return <UserAvatar user={user} size={size} />;
  }
};

export const KeyGroupName = ({ keyGroup }: { keyGroup: KeyGroup }) => {
  switch (keyGroup.sortKey.kind) {
    case "track":
      const trackConfig =
        trackConfigs[keyGroup.sortKey.track.name as TrackName];
      return trackConfig.name;
    case "user":
      return keyGroup.sortKey.user.name ?? "Anon";
  }
};

type Params = {
  resource?: string;
  id?: string;
};

export const TracksPage = ({ params }: { params: Params }) => {
  return (
    <AppShell>
      <TrackListWrapper params={params} />
    </AppShell>
  );
};

const accessor = (
  flatStats: FlatStats,
  userId: string,
  trackName: string,
  offset: number,
): number | undefined => {
  return flatStats[offset]?.data?.[userId]?.[trackName] ?? undefined;
};

export const hrefForKeyGroup = (kg: KeyGroup) => {
  switch (kg.sortKey.kind) {
    case "track":
      return `/tracks/${kg.sortKey.track.name}`;
    case "user":
      return `/users/${kg.sortKey.user.id}`;
  }
};

type FlatStat = StatList["results"][0];
type FlatStats = FlatStat[];

export interface CustomSession extends DefaultSession {
  user: {
    id: string;
    username: string | null;
  } & DefaultSession["user"];
}

function TrackListWrapper({ params }: { params: Params }) {
  const session = useSession();
  const { resource, id } = params;

  if (session.data && (resource === "tracks" || resource === "users")) {
    // TODO: This is horrendous – how do we get the type properly on
    //  the client through next-auth?
    const custom = session.data as unknown as CustomSession;
    return <TrackList session={custom} resource={resource} id={id} />;
  } else {
    return null;
  }
}

type Editing = {
  keyGroup: KeyGroup;
  date: DateString;
  value: number | undefined;
  previousValue: number | undefined;
};

function TrackList({
  resource,
  id,
  session,
}: {
  resource: "users" | "tracks";
  id?: string;
  session: CustomSession;
}) {
  const router = useRouter();

  const [editing, setEditing] = useState<Editing | undefined>();
  const [topmostIdx, setTopmostIdx] = useState<number>(0);

  const { data: following } = api.user.listFollowing.useQuery();

  const {
    data: stats,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.stat.listStats.useInfiniteQuery(
    {
      followingIds: (following ?? []).map((f) => f.id),
      limit: 30,
    },
    {
      enabled: !!following,
      initialCursor: toDateString(new Date()),
      getNextPageParam: (prevPage) => prevPage.nextCursor,
    },
  );

  const flatStats: FlatStats = [];
  (stats?.pages ?? []).forEach((page: StatList) => {
    page.results.forEach((r) => flatStats.push(r));
  });

  const upsertStat = api.stat.upsertStat.useMutation({
    onSuccess: async (data) => {
      await refetch({
        refetchPage: (page: StatList) => {
          const shouldRefetch =
            toDate(page.start) <= toDate(data.date) &&
            toDate(data.date) <= toDate(page.end);
          if (shouldRefetch) {
            console.log("Will refetch page", data.date, page);
          }
          return shouldRefetch;
        },
      });
    },
  });

  const groupBy: GroupBy = resource === "users" ? "user" : "track";

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

  const scrollableRef = useRef<HTMLDivElement | null>(null);

  if (!id) {
    if (resource === "tracks") {
      router.replace("/tracks");
    } else {
      router.replace("/users/me");
    }
  }

  if (!(following && stats)) {
    return <div>Loading</div>;
  }

  let selectedKeyGroup: KeyGroup | undefined;

  switch (groupBy) {
    case "user":
      const userId = id === "me" ? session.user.id : id;
      selectedKeyGroup = keyGroups.find((kg) => kg.sortKey.user.id === userId);
      break;
    case "track":
      const trackName = id ?? keyGroups[0]?.sortKey.track.name;
      selectedKeyGroup = keyGroups.find(
        (kg) => kg.sortKey.track.name === trackName,
      );
      break;
  }

  if (!selectedKeyGroup) {
    return null;
  }

  const onScroll = debounce(() => {
    const el = scrollableRef.current;
    if (el) {
      const { top, left } = el.getBoundingClientRect();
      const testTop = top + 50;
      const testleft = left + 5;
      const topmost = el.ownerDocument.elementFromPoint(testleft, testTop);
      const tr = topmost?.closest("tr");
      const index = Array.prototype.indexOf.call(
        tr?.parentElement?.children ?? [],
        tr,
      );
      setTopmostIdx(index);
    }
  }, 200);

  const topmostDate = flatStats?.[topmostIdx]?.date;

  return (
    <Pane
      popupChildren={
        editing ? (
          <EntryPopup
            editing={editing}
            setEditing={setEditing}
            upsertStat={upsertStat}
          />
        ) : null
      }
      headerChildren={
        <div className="px-4">
          <DropdownMenu
            selectedKeyGroup={selectedKeyGroup}
            keyGroups={keyGroups}
          />
        </div>
      }
      mainChildren={
        <div
          id="scrollableDiv"
          className="h-full w-full overflow-scroll"
          ref={scrollableRef}
        >
          <InfiniteScroll
            next={fetchNextPage}
            hasMore={!!hasNextPage}
            dataLength={flatStats.length}
            scrollableTarget="scrollableDiv"
            style={{ overflow: "none" }}
            loader={<div />}
            onScroll={onScroll}
          >
            <table className="min-w-full">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="font-normal">
                  <th className="py-2 text-right">
                    <div className="w-[70px]">
                      {topmostDate && formatMonthYear(topmostDate)}
                    </div>
                  </th>
                  {selectedKeyGroup.childKeys.map((kg) => (
                    <th
                      className="py-2"
                      key={`${kg.sortKey.user.id}-${kg.sortKey.track.name}`}
                    >
                      <div className="flex items-center justify-center">
                        <KeyGroupLink keyGroup={kg} size="md" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flatStats.map((stat, dateOffset) => (
                  <TableRow
                    key={dateOffset}
                    stat={stat}
                    flatStats={flatStats}
                    dateOffset={dateOffset}
                    selectedKeyGroup={selectedKeyGroup}
                    setEditing={setEditing}
                    upsertStat={upsertStat}
                    session={session}
                  />
                ))}
              </tbody>
            </table>
          </InfiniteScroll>
        </div>
      }
    />
  );
}

const TableRow = ({
  stat,
  flatStats,
  dateOffset,
  selectedKeyGroup,
  setEditing,
  upsertStat,
  session,
}: {
  stat: FlatStat;
  flatStats: FlatStat[];
  dateOffset: number;
  selectedKeyGroup: KeyGroup | undefined;
  setEditing: (e: Editing | undefined) => void;
  upsertStat: ReturnType<typeof api.stat.upsertStat.useMutation>;
  session: CustomSession;
}) => {
  const date = stat.date;
  const isWeekend = isSaturday(toDate(date)) || isSunday(toDate(date));

  return (
    <tr key={`${dateOffset}`} className={isWeekend ? "bg-gray-100" : ""}>
      <td className="w-[70px] text-right text-sm">
        <div>{formatDate(date)}</div>
      </td>
      {selectedKeyGroup?.childKeys.map((keyGroup) => {
        const sk = keyGroup.sortKey;
        const value = accessor(
          flatStats,
          sk.user.id,
          sk.track.name,
          dateOffset,
        );
        const previousValue = accessor(
          flatStats,
          sk.user.id,
          sk.track.name,
          dateOffset + 1,
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
              upsertStat={upsertStat}
            >
              <CellValue trackName={sk.track.name} value={value} />
            </InteractiveCell>
          </td>
        );
      })}
    </tr>
  );
};

const getUnitName = (user: CurrentUser, trackName: string) => {
  if (trackName === "weight") {
    return user.useMetric ? "Kg" : "lb";
  } else {
    const trackConfig = trackConfigs[trackName as TrackName];
    return trackConfig.units;
  }
};

const EntryPopup = ({
  editing,
  setEditing,
  upsertStat,
}: {
  editing: Editing;
  setEditing: (e: Editing | undefined) => void;
  upsertStat: ReturnType<typeof api.stat.upsertStat.useMutation>;
}) => {
  const user = useCurrentUser();
  const [valueInUserUnits, setValueInUserUnits] = useState<number | undefined>(
    parseFloat(
      convertWeight(
        editing.value ?? editing.previousValue ?? 0,
        "metric",
        getMeasurement(user),
      ).toFixed(1),
    ),
  );
  const { date, keyGroup } = editing;
  const trackConfig = trackConfigs[keyGroup.sortKey.track.name as TrackName];
  const trackId = keyGroup.sortKey.track.id;
  const trackName = trackConfig.name ?? "?";
  const trackEmoji = trackConfig.icon ?? "?";
  const icon = trackEmoji ? (
    <Icon fallback={trackEmoji} alt={trackEmoji} size={"xl"} />
  ) : (
    false
  );
  const unit = getUnitName(user, keyGroup.sortKey.track.name);

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
            value={valueInUserUnits}
            onChange={setValueInUserUnits}
            min={trackConfig.min}
            max={trackConfig.max}
            incr={trackConfig.incr}
            unit={unit}
          />
        </div>
        <button
          type="button"
          className="rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          onClick={async () => {
            if (valueInUserUnits) {
              const value = convertWeight(
                valueInUserUnits,
                getMeasurement(user),
                "metric",
              );
              await upsertStat.mutateAsync({
                date,
                trackId,
                value,
              });
            }
            setEditing(undefined);
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
};
