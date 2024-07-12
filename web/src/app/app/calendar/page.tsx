"use client";

import {
  DefaultMainContentAnimation,
  MainContent,
} from "@buds/app/_components/Pane";
import { useSession } from "next-auth/react";
import React from "react";
import { CustomSession } from "@buds/app/_components/TracksPage";
import { api } from "@buds/trpc/react";
import { RouterOutputs } from "@buds/trpc/shared";
import { toDateStringUTC } from "@buds/shared/utils";

type TrackListItem = RouterOutputs["track"]["list"][0];

type HabitFields = {
  name: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
};

const Wrapper = () => {
  const session = useSession();

  // TODO: This is horrendous – how do we get the type properly on
  //  the client through next-auth?
  const ready = Boolean(session.data);
  const content = !ready ? null : (
    <Calendar session={session.data as unknown as CustomSession} />
  );

  return <MainContent id="pane-main-scrollable-div">{content}</MainContent>;
};

const Calendar = ({ session }: { session: CustomSession }) => {
  const { data: calendar } = api.stat.listStats.useQuery({
    followingIds: [session.user.id],
    cursor: toDateStringUTC(new Date()),
    limit: 30,
  });
  if (!calendar) {
    return null;
  }

  return (
    <MainContent>
      <DefaultMainContentAnimation>
        <pre>{JSON.stringify(calendar, null, 2)}</pre>
      </DefaultMainContentAnimation>
    </MainContent>
  );
};

export default function Page() {
  return <Wrapper />;
}
