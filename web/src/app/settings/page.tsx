"use client";
import AppShell from "@buds/app/_components/AppShell";

export default function Settings() {
  return (
    <AppShell>
      <main className={`h-screen px-4 pb-16 pt-4 font-light text-gray-600`}>
        <div className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-[#7371b5] shadow-xl drop-shadow-xl">
          <div
            id="scrollableDiv"
            className="w-full flex-grow overflow-scroll rounded-b-xl bg-gray-50"
          >
            TODO: User settings: emoji, imperial vs. metric, allow saving.
          </div>
        </div>
      </main>
    </AppShell>
  );
}
