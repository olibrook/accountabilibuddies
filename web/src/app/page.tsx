"use client";

import Link from "next/link";

import { BaseAppShell } from "@buds/app/_components/AppShell";
import { useSession } from "next-auth/react";

export default function Home() {
  return (
    <BaseAppShell>
      <Inner />
    </BaseAppShell>
  );
}

const Inner = () => {
  const session = useSession();
  return (
    <div className="h-screen w-full">
      <div className="flex h-full flex-row items-center justify-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-[5rem]">
            Accountabili
            <span className="text-[hsl(280,100%,70%)]">buddies</span>
          </h1>

          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-col items-center justify-center gap-4">
              <p className="text-l text-center text-white">
                {session && (
                  <span>Logged in as {session.data?.user?.name}</span>
                )}
              </p>
              <Link
                href={session ? "/api/auth/signout" : "/api/auth/signin"}
                className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
              >
                {session ? "Sign out" : "Sign in"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
