"use client";
import AppShell from "@buds/app/_components/AppShell";
import { useSession } from "next-auth/react";
import React from "react";
import { Avatar, CustomSession } from "@buds/app/_components/TracksPage";
import { api } from "@buds/trpc/react";
import { useForm } from "react-hook-form";
import { Pane } from "@buds/app/_components/Pane";
import {
  SettingsForm,
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

export const NeutralHeading = ({ me }: { me: Me }) => {
  return (
    <>
      <div className="my-2 flex w-full items-center justify-center px-4 text-center">
        <Avatar size="4xl" userName={me.name ?? ""} imageUrl={me.image} />
      </div>
      <div className="my-4 w-full px-4 text-center text-2xl font-semibold">
        {me.name}
      </div>
    </>
  );
};

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
        <div className="flex w-full flex-grow flex-col items-center overflow-scroll rounded-b-xl bg-gray-50 px-8 pt-8">
          <NeutralHeading me={me} />
          <SettingsForm
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
