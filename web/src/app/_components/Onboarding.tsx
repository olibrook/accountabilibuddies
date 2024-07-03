"use client";
import { useSession } from "next-auth/react";
import React from "react";
import { CustomSession } from "@buds/app/_components/TracksPage";
import { api } from "@buds/trpc/react";
import {
  OnboardingSettingsForm,
  useSettingsFormProps,
} from "@buds/app/_components/SettingsForm";
import { RouterOutputs } from "@buds/trpc/shared";
import { DefaultMainContentAnimation } from "@buds/app/_components/Pane";

type Me = RouterOutputs["user"]["me"];

export function Onboarding() {
  const session = useSession();
  const { data: me } = api.user.me.useQuery();

  if (session.data && me) {
    // TODO: This is horrendous – how do we get the type properly on
    //  the client through next-auth?
    const custom = session.data as unknown as CustomSession;
    return <OnboardingContent session={custom} me={me} />;
  } else {
    return null;
  }
}

function OnboardingContent(props: { session: CustomSession; me: Me }) {
  const { me } = props;
  const { onSubmit, hookForm } = useSettingsFormProps(me);

  return (
    <div className="h-screen w-full">
      <DefaultMainContentAnimation>
        <div className="flex h-full w-full flex-col items-center justify-center gap-8">
          <div className="flex w-full max-w-screen-md flex-col items-center justify-center overflow-hidden rounded-3xl bg-gray-50 py-3 py-8 text-center">
            <OnboardingSettingsForm
              me={me}
              onSubmit={onSubmit}
              hookForm={hookForm}
              submitButton={
                <div className="flex w-full flex-row items-center justify-end">
                  <button type="submit" className="btn btn-primary">
                    Continue
                  </button>
                </div>
              }
            />
          </div>
        </div>
      </DefaultMainContentAnimation>
    </div>
  );
}
