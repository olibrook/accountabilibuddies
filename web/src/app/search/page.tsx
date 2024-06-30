"use client";
import AppShell from "@buds/app/_components/AppShell";
import { Pane } from "@buds/app/_components/Pane";
import { api } from "@buds/trpc/react";
import { Search as SearchIcon } from "react-feather";
import { Avatar } from "@buds/app/_components/TracksPage";
import React, { useCallback, useState } from "react";
import { debounce } from "next/dist/server/utils";

export default function Search() {
  const [queryInputValue, _setQueryInputValue] = useState<string>("");
  const [query, _setQuery] = useState<string>("");

  const setQuery = useCallback(
    debounce((value: string) => {
      console.log(`Debounced invocation with v="${value}"`);
      _setQuery(value);
    }, 200),
    [],
  );

  const setQueryInputValue = (v: string) => {
    _setQueryInputValue(v);
    setQuery(v);
  };

  const { data: users, refetch } = api.user.search.useQuery({
    cursor: 0,
    limit: 25,
    query,
  });

  const setFollowing = api.user.setFollowing.useMutation();
  const doSetFollowing = async (data: {
    followingId: string;
    shouldFollow: boolean;
  }) => {
    await setFollowing.mutateAsync(data);
    await refetch();
  };

  return (
    <AppShell>
      <Pane
        headerChildren={<div className="px-4 text-xl">Search</div>}
        mainChildren={
          <div className="flex h-full w-full flex-col items-center justify-between bg-gray-50">
            <div className="w-full shrink-0 grow-0 p-4">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
                  <SearchIcon />
                </div>
                <input
                  type="search"
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-4 ps-10 text-sm text-gray-900 outline-0"
                  placeholder="Search username"
                  value={queryInputValue}
                  onChange={(e) => setQueryInputValue(e.target.value)}
                />
              </div>
            </div>

            <div className="w-full shrink grow overflow-y-scroll rounded-b-xl bg-gray-50">
              {users?.map((u, i) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-4 px-4 py-2"
                >
                  <div>
                    <Avatar
                      size="lg"
                      userName={u.name ?? "???"}
                      imageUrl={u.image}
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="font-mono text-lg font-bold">
                      {u.username ?? "???"}
                    </div>
                    <div className="text-sm">{u.name}</div>
                  </div>

                  {!u.following ? (
                    <div>
                      <button
                        className="w-20 rounded-md bg-blue-500 px-3 py-2 text-xs font-semibold text-white focus:outline-none"
                        onClick={() =>
                          doSetFollowing({
                            followingId: u.id,
                            shouldFollow: true,
                          })
                        }
                      >
                        Follow
                      </button>
                    </div>
                  ) : (
                    <div>
                      <button
                        className="w-20 rounded-md bg-gray-200 px-3 py-2 text-xs font-semibold"
                        onClick={() =>
                          doSetFollowing({
                            followingId: u.id,
                            shouldFollow: false,
                          })
                        }
                      >
                        Following
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        }
      />
    </AppShell>
  );
}
