import { getServerAuthSession } from "@buds/server/auth";
import { api } from "@buds/trpc/server";
import {
  differenceInDays,
  format,
  isSaturday,
  isSunday,
  subDays,
} from "date-fns";
import { RouterOutputs } from "@buds/trpc/shared";

type StatList = RouterOutputs["stat"]["listStats"];
type FollowingList = RouterOutputs["user"]["listFollowing"];
type User = FollowingList[0];
type Track = FollowingList[0]["tracks"][0];
type RowAccessor = (sl: StatList, offset: number) => number | undefined;
type Grouper = [string, string, User, Track, RowAccessor];
type GroupBy = "user" | "track";

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

const groupByUser = (a: Grouper, b: Grouper): number => {
  const [userKeyA, trackKeyA, ...restA] = a;
  const [userKeyB, trackKeyB, ...restB] = b;
  const outerCmp = cmp(userKeyA, userKeyB);
  return outerCmp === 0 ? cmp(trackKeyA, trackKeyB) : outerCmp;
};

const groupByTrack = (a: Grouper, b: Grouper): number => {
  const [userKeyA, trackKeyA, ...restA] = a;
  const [userKeyB, trackKeyB, ...restB] = b;
  const outerCmp = cmp(trackKeyA, trackKeyB);
  return outerCmp === 0 ? cmp(userKeyA, userKeyB) : outerCmp;
};

export default async function Home() {
  const session = await getServerAuthSession();

  if (!session?.user) return null;

  const following = await api.user.listFollowing.query();

  // TODO: This limits the number of buddies displayed, remove!
  const sliced = following.slice(0, 3);

  const stats = await api.stat.listStats.query({
    followingIds: (following || []).map((f) => f.id),
  });

  const groupers: Grouper[] = [];

  sliced.forEach((user) => {
    user.tracks.forEach((track) => {
      const accessor = (sl: StatList, offset: number) => {
        return sl?.stats?.[user.id]?.[track.name]?.data[offset] ?? undefined;
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

  const groupBy: GroupBy = "track";
  const sortFunc = groupBy === "user" ? groupByUser : groupByTrack;
  groupers.sort(sortFunc);

  const numRows = differenceInDays(stats.end, stats.start);
  const rowsMap = Array.from(new Array(numRows));

  const headerExtractor = (show: GroupBy) => {
    // eslint-disable-next-line react/display-name
    return (grouper: Grouper) => {
      const user = grouper[2];
      const track = grouper[3];
      const key = show === "user" ? user.id : track.id;
      const content = show === "user" ? user.name ?? "Anon" : track.name;
      return <th key={key}>{content}</th>;
    };
  };

  const extractUserHeader = headerExtractor("user");
  const extractTrackHeader = headerExtractor("track");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <h1>Buddies</h1>
      <table>
        <thead>
          <tr>
            <th></th>
            {groupers.map(
              groupBy === "user" ? extractUserHeader : extractTrackHeader,
            )}
          </tr>
          <tr>
            <th>Date</th>
            {groupers.map(
              groupBy === "user" ? extractTrackHeader : extractUserHeader,
            )}
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
                  return (
                    <td key={`${dateOffset}-${columnOffset}`}>
                      {accessor(stats, dateOffset)}
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
