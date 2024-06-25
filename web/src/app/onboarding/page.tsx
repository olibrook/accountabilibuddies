"use client";
import { BaseAppShell, ToggleButton } from "@buds/app/_components/AppShell";
import { useSession } from "next-auth/react";
import React, { InputHTMLAttributes, useEffect, useState } from "react";
import { Avatar, CustomSession } from "@buds/app/_components/TracksPage";
import { api } from "@buds/trpc/react";
import { Controller, useForm } from "react-hook-form";
import { FieldErrorDisplay } from "@buds/app/settings/page";

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
    formState: { errors, isValid },
    watch,
    setError,
    clearErrors,
    getValues,
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

  const save = async () => {
    const data: WritableFields = getValues();
    await updateMe.mutateAsync(data);
  };

  useEffect(() => {
    const inner = async (val: { username: string }) => {
      const available = await usernameAvailable.mutateAsync(val);
      if (!available) {
        setError("username", { type: "error", message: "Username taken" });
      } else {
        clearErrors("username");
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

  const panes = (
    <div key={1}>
      <OnboardingSlide
        nextClickEnabled={isValid}
        onNextClick={async () => {
          await save();
          // Redirect on success
        }}
        slide={1}
        numSlides={1}
      >
        <div className="my-4">
          <div className="my-2 flex items-center justify-center px-4 text-center">
            <Avatar size="4xl" userName={me.name ?? ""} imageUrl={me.image} />
          </div>
          <div className="my-2 px-4 text-center">Welcome!</div>
          <div className="my-4 px-4 text-center text-2xl font-semibold">
            {me.name}
          </div>
          <div className="my-4 px-4 text-center ">
            A few details before we get started
          </div>

          <form onSubmit={(e) => e.preventDefault()}>
            <Controller
              rules={{ minLength: 5 }}
              control={control}
              name="username"
              render={({ field }) => (
                <div className="flex w-full flex-col">
                  <TextInput label="Username" {...field} />
                  <FieldErrorDisplay error={errors.username} />
                </div>
              )}
            />
            <Controller
              control={control}
              render={({ field: { onChange, value } }) => (
                <div className="mb-2 block flex items-center py-2">
                  <ToggleButton
                    value={value === "⭐"}
                    onChange={(val) => {
                      onChange(val ? "⭐" : "💖");
                    }}
                    label="Use 💖 / ⭐ as progress emoji"
                  />
                </div>
              )}
              name="checkMark"
            />

            <Controller
              control={control}
              render={({ field: { onChange, value } }) => (
                <div className="mb-2 block flex items-center py-2">
                  <ToggleButton
                    onChange={onChange}
                    value={value}
                    label="Use imperial / metric units?"
                  />
                </div>
              )}
              name="useMetric"
            />
          </form>
        </div>
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
  console.log(nextClickEnabled);
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

const TextInput = ({
  label,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
}) => (
  <div className={`relative ${className ?? ""}`}>
    <input
      {...rest}
      autoComplete="off"
      type="text"
      id="password"
      className="border-1 peer block w-full appearance-none rounded-lg border border-gray-300 bg-white px-2.5 pb-2.5 pt-4 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-0"
      placeholder=" "
    />
    <label
      htmlFor="password"
      className="absolute left-1 top-2 z-10 origin-[0] -translate-y-4 scale-75 transform cursor-text select-none bg-white px-2 text-sm text-gray-500 duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-blue-600"
    >
      {" "}
      {label}
    </label>
  </div>
);
