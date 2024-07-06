"use client";

import {
  DefaultMainContentAnimation,
  MainContent,
} from "@buds/app/_components/Pane";
import { useSession } from "next-auth/react";
import React, { useCallback, useEffect, useState } from "react";
import { CustomSession } from "@buds/app/_components/TracksPage";
import { api } from "@buds/trpc/react";
import { RouterInputs, RouterOutputs } from "@buds/trpc/shared";
import { Controller, useForm } from "react-hook-form";
import eq from "lodash/eq";

type TrackUpsert = RouterInputs["track"]["upsert"];
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
    <Habits session={session.data as unknown as CustomSession} />
  );

  return <MainContent id="pane-main-scrollable-div">{content}</MainContent>;
};

const Habits = ({ session }: { session: CustomSession }) => {
  const apiContext = api.useContext();
  const upsertTrackMutation = api.track.upsert.useMutation();
  const { data: tracks } = api.track.list.useQuery({ userId: session.user.id });
  if (!tracks) {
    return null;
  }

  const upsertTrack = async (track: TrackUpsert) => {
    const updated = await upsertTrackMutation.mutateAsync(track);

    apiContext.track.list.setData({ userId: session.user.id }, (oldData) => {
      if (!oldData) return oldData;
      return oldData.map((old) => (old.id === track.id ? track : old));
    });
  };

  return (
    <MainContent>
      <DefaultMainContentAnimation>
        <div className="flex h-full w-full flex-col items-center justify-between bg-gray-50">
          <div className="flex h-full w-full flex-col justify-start gap-4 p-4">
            {tracks.map((track) => (
              <HabitForm
                key={track.id}
                track={track}
                upsertTrack={upsertTrack}
              />
            ))}
            {/*<div className="flex w-full items-center justify-center">*/}
            {/*  <div className="btn btn-primary flex items-center">*/}
            {/*    <Plus size="24" />*/}
            {/*    <h3 className="text-lg font-bold">New habit</h3>*/}
            {/*  </div>*/}
            {/*</div>*/}
          </div>
        </div>
      </DefaultMainContentAnimation>
    </MainContent>
  );
};

const HabitForm = ({
  track,
  upsertTrack,
}: {
  track: TrackListItem;
  upsertTrack: (track: TrackUpsert) => void;
}) => {
  const defaultSchedule = {
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
  };
  const schedule = track.schedules?.[0] ?? defaultSchedule;
  const [initialValues, _] = useState<HabitFields>({
    name: track.name,
    ...schedule,
  });

  const form = useForm<HabitFields>({
    values: initialValues,
    defaultValues: {
      name: "",
      ...defaultSchedule,
    },
  });

  const { watch } = form;

  const doUpsertTrack = useCallback((data: TrackUpsert) => {
    if (!eq(track, data)) {
      upsertTrack(data);
    }
  }, []);

  useEffect(() => {
    const subscription = watch((value) => {
      const { name, ...schedule } = value;
      const updateData = {
        id: track.id,
        name: name ?? "",
        schedules: [{ ...defaultSchedule, ...schedule }],
      };
      doUpsertTrack(updateData);
    });
    return () => subscription.unsubscribe();
  }, [watch, doUpsertTrack]);

  const days: [keyof typeof defaultSchedule, string][] = [
    ["monday", "Mon"],
    ["tuesday", "Tue"],
    ["wednesday", "Wed"],
    ["thursday", "Thu"],
    ["friday", "Fri"],
    ["saturday", "Sat"],
    ["sunday", "Sun"],
  ];

  return (
    <div
      key={track.id}
      className="flex w-full flex-col rounded border bg-white"
    >
      <Controller
        name="name"
        control={form.control}
        render={({ field }) => (
          <label className="input input-bordered m-4 flex items-center gap-2">
            <input
              className="w-full"
              type="text"
              placeholder="Search"
              autoComplete="false"
              {...field}
              disabled={true}
            />
          </label>
        )}
      />
      {track.schedules?.[0] && (
        <div className="items center flex w-full justify-between gap-2 px-4">
          {days.map(([k, day]) => (
            <div
              key={day}
              className="flex flex-col items-center justify-center"
            >
              <Controller
                name={k}
                control={form.control}
                render={({ field }) => (
                  <>
                    <div
                      className={`h-10 w-10 rounded-full ${
                        field.value ? "bg-coral" : "bg-gray-200"
                      }`}
                      onClick={() => field.onChange(!field.value)}
                    />
                    <div className="text-xs">{day}</div>
                  </>
                )}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Page() {
  return <Wrapper />;
}
