import { getServerAuthSession } from "@buds/server/auth";
import { api } from "@buds/trpc/server";

export default async function Home() {
  const session = await getServerAuthSession();

  if (!session?.user) return null;

  const following = await api.user.listFollowing.query();

  const stats = await api.stat.listStats.query({
    followingIds: (following || []).map((f) => f.id),
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <h1>This is the thing</h1>
      <pre>{JSON.stringify(following, null, 4)}</pre>
      <pre>{JSON.stringify(stats, null, 4)}</pre>
    </main>
  );
}
