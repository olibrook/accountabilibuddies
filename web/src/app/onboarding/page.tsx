"use client";
import { BaseAppShell } from "@buds/app/_components/AppShell";
import { useSession } from "next-auth/react";
import React, { useState } from "react";
import { CustomSession } from "@buds/app/_components/TracksPage";
import { api } from "@buds/trpc/react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { RouterOutputs } from "@buds/trpc/shared";
import {
  OnboardingSettingsForm,
  SettingsFormFields,
} from "@buds/app/_components/SettingsForm";

type Me = RouterOutputs["user"]["me"];

export default function Onboarding() {
  return (
    <BaseAppShell>
      <OnboardingPaneWrapper />
    </BaseAppShell>
  );
}

function OnboardingPaneWrapper() {
  const session = useSession();
  const { data: me } = api.user.me.useQuery();

  if (session.data && me) {
    // TODO: This is horrendous – how do we get the type properly on
    //  the client through next-auth?
    const custom = session.data as unknown as CustomSession;
    return <OnboardingPane session={custom} me={me} />;
  } else {
    return null;
  }
}

function OnboardingPane(props: { session: CustomSession; me: Me }) {
  const { me } = props;
  const router = useRouter();

  const updateMe = api.user.updateMe.useMutation();

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % 3);
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

  const panes = (
    <div key={1}>
      <OnboardingSlide
        nextClickEnabled={hookForm.formState.isValid}
        onNextClick={async () => {
          if (!hookForm.formState.isValid) {
            return;
          }
          await updateMe.mutateAsync(hookForm.getValues());
          router.push("/users/me");
        }}
        slide={1}
        numSlides={1}
      >
        <OnboardingSettingsForm me={me} hookForm={hookForm} />
      </OnboardingSlide>
    </div>
  );

  return (
    <div className="h-screen w-screen overflow-hidden">
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {panes}
      </div>
    </div>
  );
}

const DotNav = ({ length, current }: { length: number; current: number }) => {
  return (
    <ul className="flex space-x-2">
      {Array.from(new Array(length)).map((_, i) => (
        <li key={i}>
          <div
            className={`h-2 w-2 rounded-full border border-gray-400 ${
              i === current ? "bg-gray-400" : "bg-white"
            }`}
          ></div>
        </li>
      ))}
    </ul>
  );
};

const OnboardingSlide = ({
  children,
  slide,
  numSlides,
  nextClickEnabled,
  onNextClick,
}: {
  children: React.ReactNode;
  slide: number;
  numSlides: number;
  nextClickEnabled: boolean;
  onNextClick: () => void;
}) => {
  return (
    <div key={slide}>
      <div className="h-screen w-screen shrink-0 overflow-hidden p-6">
        <div className="flex h-full w-full flex-col items-center justify-between rounded-xl bg-gray-50 ">
          <div className="flex-grow">{children}</div>
          <div className="mb-6 mt-4 w-full">
            {numSlides > 1 && (
              <div className="mb-4 flex w-full items-center justify-center px-4">
                <DotNav current={slide} length={numSlides} />
              </div>
            )}

            <div className="flex w-full items-center justify-center">
              <button
                disabled={!nextClickEnabled}
                type="button"
                className={`rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4 ${
                  nextClickEnabled
                    ? "bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    : "cursor-not-allowed bg-gray-500"
                }`}
                onClick={onNextClick}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
