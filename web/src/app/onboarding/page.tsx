"use client";
import { BaseAppShell } from "@buds/app/_components/AppShell";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { Avatar, CustomSession } from "@buds/app/_components/TracksPage";
import { api } from "@buds/trpc/react";
import { useForm } from "react-hook-form";

// Onboarding 1 – Set up user name and settings

// Onboarding 2 – Set your tracked activities

// Onboarding 3 – Blurb, info
//  -> Link to users/me

export default function Onboarding() {
  return (
    <BaseAppShell>
      <OnboardingPaneWrapper />
    </BaseAppShell>
  );
}

function OnboardingPaneWrapper() {
  const session = useSession();

  if (session.data) {
    // TODO: This is horrendous – how do we get the type properly on
    //  the client through next-auth?
    const custom = session.data as unknown as CustomSession;
    return <OnboardingPane session={custom} />;
  } else {
    return null;
  }
}

type WritableFields = {
  username?: string;
  useMetric: boolean;
  checkMark: string;
};

function OnboardingPane(props: { session: CustomSession }) {
  const { data: me } = api.user.me.useQuery();
  const [alertIsOpen, setAlertIsOpen] = useState(false);

  const {
    control,
    formState: { errors },
    handleSubmit,
    watch,
    setError,
  } = useForm<WritableFields>({
    values: {
      username: me?.username ?? undefined,
      useMetric: me?.useMetric ?? true,
      checkMark: me?.checkMark ?? "⭐",
    },
    defaultValues: {
      username: undefined,
      useMetric: true,
      checkMark: "⭐",
    },
  });

  // TODO: As the user types their new username, check to see if
  // it's available and show that in the error field of the input
  const usernameAvailable = api.user.usernameAvailable.useMutation();
  const updateMe = api.user.updateMe.useMutation();

  useEffect(() => {
    const inner = async (val: { username: string }) => {
      const available = await usernameAvailable.mutateAsync(val);
      if (available) {
        setError("username", { type: "info", message: "Username available!" });
      } else {
        setError("username", { type: "error", message: "Username taken" });
      }
    };
    // TODO: Watch just the one field. Then connect up the callbacks, etc.
    const subscription = watch((value, { name, type }) => {
      if (name === "username" && value.username) {
        void inner({ username: value.username });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % 3);
  };

  if (!me) {
    return false;
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {Array.from(new Array(3)).map((_, i) => (
          <div key={i}>
            <OnboardingSlide nextSlide={nextSlide} slide={i} numSlides={3}>
              <div className="my-4">
                <div className="my-2 flex items-center justify-center px-4 text-center">
                  <Avatar
                    size="4xl"
                    userName={me.name ?? ""}
                    imageUrl={me.image}
                  />
                </div>
                <div className="my-2 px-4 text-center">Welcome!</div>
                <div className="my-4 px-4 text-center text-2xl font-semibold">
                  {me.name}
                </div>
                <div className="my-4 px-4 text-center ">
                  We need just a few details to get started.
                </div>
              </div>
            </OnboardingSlide>
          </div>
        ))}
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
  nextSlide,
}: {
  children: React.ReactNode;
  slide: number;
  numSlides: number;
  nextSlide: () => void;
}) => {
  return (
    <div key={slide}>
      <div className="h-screen w-screen shrink-0 overflow-hidden p-6">
        <div className="flex h-full w-full flex-col items-center justify-between rounded-xl bg-gray-50 ">
          <div className="flex-grow">{children}</div>
          <div className="mb-6 mt-4 w-full">
            <div className="mb-4 flex w-full items-center justify-center px-4">
              <DotNav current={slide} length={3} />
            </div>

            <div className="flex w-full items-center justify-center">
              <button
                type="button"
                className="rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                onClick={nextSlide}
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
