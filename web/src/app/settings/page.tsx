"use client";
import AppShell from "@buds/app/_components/AppShell";
import { Pane } from "@buds/app/_components/Pane";
import { useSession } from "next-auth/react";
import React from "react";
import { Avatar, CustomSession } from "@buds/app/_components/TracksPage";
import { api } from "@buds/trpc/react";

export default function Settings() {
  return (
    <AppShell>
      <SettingsPaneWrapper />
    </AppShell>
  );
}

function SettingsPaneWrapper() {
  const session = useSession();

  if (session.data) {
    // TODO: This is horrendous – how do we get the type properly on
    //  the client through next-auth?
    const custom = session.data as unknown as CustomSession;
    return <SettingsPane session={custom} />;
  } else {
    return null;
  }
}

function SettingsPane() {
  const { data: me } = api.user.me.useQuery();

  return (
    <Pane
      headerChildren={<div className="px-4 text-xl">Me</div>}
      mainChildren={
        me && (
          <div className="flex w-full flex-grow flex-col items-center overflow-scroll rounded-b-xl bg-gray-50">
            <div className="">
              <Avatar size="4xl" userName={me.name} imageUrl={me.image} />
            </div>
            <h2 className="text-4xl">{me.name}</h2>
            <pre>{JSON.stringify(me, null, 2)}</pre>
          </div>
        )
      }
    />
  );
}
