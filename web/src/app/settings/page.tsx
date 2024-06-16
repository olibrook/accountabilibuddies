"use client";
import AppShell, { ToggleButton } from "@buds/app/_components/AppShell";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { Avatar, CustomSession } from "@buds/app/_components/TracksPage";
import { api } from "@buds/trpc/react";
import { Controller, FieldError, useForm } from "react-hook-form";
import AlertDialog from "@buds/app/_components/AlertDialog";
import { Pane } from "@buds/app/_components/Pane";

const FieldErrorDisplay = ({ error }: { error?: FieldError }) => {
  const color = error?.type === "info" ? "green" : "red";
  return (
    <p className="py-1 pr-1 text-right text-xs">
      {error ? (
        <span style={{ color }}>{error.message}</span>
      ) : (
        <span>&nbsp;Ooops</span>
      )}
    </p>
  );
};

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

type WritableFields = {
  username?: string;
  useMetric: boolean;
  checkMark: string;
};

function SettingsPane(props: { session: CustomSession }) {
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
  const onsubmit = async (data: WritableFields) => {
    await Promise.resolve();
    await updateMe.mutateAsync(data);
  };

  useEffect(() => {
    const inner = async (val: { username: string }) => {
      const available = await usernameAvailable.mutateAsync(val);
      if (available) {
        setError("username", { type: "info", message: "Ok!" });
      } else {
        setError("username", { type: "error", message: "Username taken" });
      }
    };
    // TODO: Watch just the one field. Then connect up the callbacks, etc.
    const subscription = watch((value, { name, type }) => {
      console.log(value, name, type);
      if (name === "username" && value.username) {
        void inner({ username: value.username });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  if (!me) {
    return false;
  }
  return (
    <div>
      <AlertDialog
        message={"You cannot change your username once set. You sure?"}
        onConfirm={() => {
          setAlertIsOpen(false);
        }}
        onClose={() => {
          setAlertIsOpen(false);
        }}
        isOpen={alertIsOpen}
      />
      <Pane
        headerChildren={<div className="px-4 text-xl">Me</div>}
        mainChildren={
          me && (
            <div className="flex w-full flex-grow flex-col items-center overflow-scroll rounded-b-xl bg-gray-50 pt-8">
              <div className="">
                <Avatar
                  size="4xl"
                  userName={me.name ?? ""}
                  imageUrl={me.image}
                />
              </div>
              <div className="mx-auto w-full rounded-md p-4">
                <h2 className="mb-4 text-center text-2xl font-semibold">
                  {me.name}
                </h2>
                <form onSubmit={handleSubmit(onsubmit)}>
                  <Controller
                    control={control}
                    name="username"
                    render={({ field }) => (
                      <div>
                        <label
                          htmlFor="username"
                          className="block font-medium text-gray-600"
                        >
                          Username
                        </label>
                        <input
                          type="text"
                          id="username"
                          {...field}
                          value={field.value}
                          className={`mt-1 w-full rounded-md border px-4 py-2 focus:outline-none ${
                            errors.username?.type === "error" &&
                            "border-red-500"
                          }`}
                        />
                        <FieldErrorDisplay error={errors.username} />
                      </div>
                    )}
                  />

                  <div>
                    <label
                      htmlFor="email"
                      className="block font-medium text-gray-600"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      disabled={true}
                      value={me.email ?? undefined}
                      className={`mt-1 w-full rounded-md border px-4 py-2 focus:outline-none`}
                    />
                    <FieldErrorDisplay error={undefined} />
                  </div>

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

                  <div className="flex w-full flex-row items-center justify-end">
                    <button
                      type="submit"
                      className="rounded-md bg-blue-500 px-4 py-2 text-white focus:outline-none"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )
        }
      />
    </div>
  );
}
