"use client";
import { api } from "@buds/trpc/react";
import { Avatar } from "@buds/app/_components/TracksPage";
import React, { useCallback, useState } from "react";
import { debounce } from "next/dist/server/utils";
import {
  DefaultMainContentAnimation,
  MainContent,
} from "@buds/app/_components/Pane";

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
    <MainContent>
      <DefaultMainContentAnimation>
        <div className="flex h-full w-full flex-col items-center justify-between bg-gray-50">
          <div className="w-full shrink-0 grow-0 p-4">
            <label className="input input-bordered flex items-center gap-2">
              <input
                type="text"
                className="grow"
                placeholder="Search"
                value={queryInputValue}
                onChange={(e) => setQueryInputValue(e.target.value)}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4 opacity-70"
              >
                <path
                  fillRule="evenodd"
                  d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </label>
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
      </DefaultMainContentAnimation>
    </MainContent>
  );
}
