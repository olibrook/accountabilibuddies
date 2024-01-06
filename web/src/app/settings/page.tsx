"use client";
import AppShell, { ToggleButton } from "@buds/app/_components/AppShell";
import { Pane } from "@buds/app/_components/Pane";
import { useSession } from "next-auth/react";
import React from "react";
import { Avatar, CustomSession } from "@buds/app/_components/TracksPage";
import { api } from "@buds/trpc/react";
import { Controller, useForm } from "react-hook-form";
import { RouterInputs } from "@buds/trpc/shared";

// TODO: Remove submit button, make this a live update thing.

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

type UpdateMe = RouterInputs["user"]["updateMe"];

function SettingsPane() {
  const utils = api.useContext();
  const { data: me } = api.user.me.useQuery();
  const updateMe = api.user.updateMe.useMutation({
    onSuccess: async () => {
      await utils.user.me.invalidate();
    },
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateMe>({
    values: me,
    defaultValues: {
      username: "",
      useMetric: true,
      checkMark: "⭐",
    },
  });

  const onSubmit = async (data: UpdateMe) => {
    await updateMe.mutateAsync(data);
  };

  if (!me) {
    return false;
  }
  return (
    <Pane
      headerChildren={<div className="px-4 text-xl">Me</div>}
      mainChildren={
        me && (
          <div className="flex w-full flex-grow flex-col items-center overflow-scroll rounded-b-xl bg-gray-50 pt-8">
            <div className="">
              <Avatar size="4xl" userName={me.name} imageUrl={me.image} />
            </div>
            <div className="mx-auto w-full rounded-md p-4">
              <h2 className="mb-4 text-center text-2xl font-semibold">
                {me.name}
              </h2>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-4">
                  <label
                    htmlFor="username"
                    className="block font-medium text-gray-600"
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    {...register("username", { required: true })}
                    className={`mt-2 w-full rounded-md border px-4 py-2 focus:outline-none ${
                      errors.username && "border-red-500"
                    }`}
                  />
                  {errors.username && (
                    <p className="mt-1 text-red-500">Username is required</p>
                  )}
                </div>

                <div className="mb-4">
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
                    value={me.email}
                    className={`mt-2 w-full rounded-md border px-4 py-2 focus:outline-none ${
                      errors.email && "border-red-500"
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-red-500">Email is required</p>
                  )}
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

                <button
                  type="submit"
                  className="rounded-md bg-blue-500 px-4 py-2 text-white focus:outline-none"
                >
                  Submit
                </button>
              </form>
            </div>
          </div>
        )
      }
    />
  );
}
