"use client";
import AppShell from "@buds/app/_components/AppShell";
import { useSession } from "next-auth/react";
import React from "react";
import { CustomSession } from "@buds/app/_components/TracksPage";
import { api } from "@buds/trpc/react";
import { useForm } from "react-hook-form";
import { Pane } from "@buds/app/_components/Pane";
import {
  NeutralHeading,
  RegularSettingsForm,
  SettingsFormFields,
} from "@buds/app/_components/SettingsForm";
import { RouterOutputs } from "@buds/trpc/shared";

export default function Settings() {
  return (
    <AppShell>
      <SettingsPaneWrapper />
    </AppShell>
  );
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
  const updateMe = api.user.updateMe.useMutation();

  const onSubmit = async (data: WritableFields) => {
    await updateMe.mutateAsync(data);
  };

  const hookForm = useForm<SettingsFormFields>({
    values: {
      username: me.username ?? undefined,
      useMetric: me.useMetric,
      checkMark: me.checkMark,
    },
    defaultValues: {
      username: undefined,
      useMetric: true,
      checkMark: "⭐",
    },
  });
  return (
    <Pane
      headerChildren={<div className="px-4 text-xl">Settings</div>}
      mainChildren={
        <div className="flex w-full flex-grow flex-col items-center overflow-scroll rounded-b-xl bg-gray-50">
          <RegularSettingsForm
            me={me}
            onSubmit={onSubmit}
            hookForm={hookForm}
            submitButton={
              <div className="flex w-full flex-row items-center justify-end">
                <button
                  type="submit"
                  className="rounded-md bg-blue-500 px-4 py-2 text-white focus:outline-none"
                >
                  Save
                </button>
              </div>
            }
          />
        </div>
      }
    />
  );
}
