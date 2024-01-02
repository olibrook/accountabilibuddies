"use client";
import AppShell from "@buds/app/_components/AppShell";
import { Pane } from "@buds/app/_components/Pane";

export default function Search() {
  return (
    <AppShell>
      <Pane
        headerChildren={<div className="px-4 text-xl">Search</div>}
        mainChildren={
          <div className="w-full flex-grow overflow-scroll rounded-b-xl bg-gray-50">
            {Array.from(new Array(100)).map((_, idx) => (
              <div key={idx} className="px-4">
                TODO: Search for users
              </div>
            ))}
          </div>
        }
      />
    </AppShell>
  );
}
