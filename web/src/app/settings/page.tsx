"use client";
import { useSession } from "next-auth/react";
import React from "react";
import { CustomSession } from "@buds/app/_components/TracksPage";
import { api } from "@buds/trpc/react";
import {
  RegularSettingsForm,
  useSettingsFormProps,
} from "@buds/app/_components/SettingsForm";
import { RouterOutputs } from "@buds/trpc/shared";
import {
  DefaultMainContentAnimation,
  MainContent,
} from "@buds/app/_components/Pane";

export default function Settings() {
  return <SettingsPaneWrapper />;
}

function SettingsPaneWrapper() {
  const session = useSession();
  const { data: me } = api.user.me.useQuery();

  if (session.data && me) {
    // TODO: This is horrendous – how do we get the type properly on
    //  the client through next-auth?
    const custom = session.data as unknown as CustomSession;
    return <SettingsPane session={custom} me={me} />;
  } else {
    return null;
  }
}

type WritableFields = {
  username?: string;
  useMetric: boolean;
  checkMark: string;
};

type Me = RouterOutputs["user"]["me"];

function SettingsPane(props: { session: CustomSession; me: Me }) {
  const { me } = props;
  const { onSubmit, hookForm } = useSettingsFormProps(me);
  return (
    // <Pane
    //   // headerChildren={<div className="px-4 text-xl">Settings</div>}
    //   mainChildren={
    //
    //   }
    // />
    <MainContent>
      <DefaultMainContentAnimation>
        <div className="flex h-full w-full flex-grow flex-col items-center bg-gray-50">
          <RegularSettingsForm
            me={me}
            onSubmit={onSubmit}
            hookForm={hookForm}
            submitButton={
              <div className="flex w-full flex-row items-center justify-end">
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            }
          />
        </div>
      </DefaultMainContentAnimation>
    </MainContent>
  );
}
