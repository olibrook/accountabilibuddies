import { getServerAuthSession } from "@buds/server/auth";
import { api } from "@buds/trpc/server";
import { differenceInDays, format, subDays } from "date-fns";
import { RouterOutputs } from "@buds/trpc/shared";
import { ReactNode } from "react";

type StatList = RouterOutputs["stat"]["listStats"];
type RowAccessor = (sl: StatList, offset: number) => number | undefined;

const formatDate = (date: Date) => format(date, "P");

export default async function Home() {
  const session = await getServerAuthSession();

  if (!session?.user) return null;

  const following = await api.user.listFollowing.query();

  // TODO: This limits the number of buddies displayed, remove!
  const sliced = following.slice(0, 3);

  const stats = await api.stat.listStats.query({
    followingIds: (following || []).map((f) => f.id),
  });

  const l1Headers: ReactNode[] = [<th key="date"></th>];
  const headers: ReactNode[] = [<th key="date">Date</th>];
  const rowAccessors: RowAccessor[] = [];

  sliced.forEach((user) => {
    l1Headers.push(
      <th key={user.id} colSpan={user.tracks.length}>
        {user.name}
      </th>,
    );
    user.tracks.forEach((track) => {
      headers.push(<th key={track.id}>{track.name}</th>);
      rowAccessors.push((sl: StatList, offset: number) => {
        return sl?.stats?.[user.id]?.[track.id].data[offset] ?? undefined;
      });
    });
  });

  const numRows = differenceInDays(stats.end, stats.start);
  const rowsMap = Array.from(new Array(numRows));

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <h1>Buddies</h1>
      <table>
        <thead>
          <tr>{l1Headers}</tr>
          <tr>{headers}</tr>
        </thead>
        <tbody>
          {rowsMap.map((_, dateOffset) => (
            <tr>
              <td>{formatDate(subDays(stats.end, dateOffset))}</td>
              {rowAccessors.map((accessor, columnOffset) => (
                <td key={`${dateOffset}-${columnOffset}`}>
                  {accessor(stats, dateOffset)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
