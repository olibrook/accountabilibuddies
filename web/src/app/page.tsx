"use client";

import Link from "next/link";

import { BaseAppShell } from "@buds/app/_components/AppShell";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  return (
    <BaseAppShell>
      <Inner />
    </BaseAppShell>
  );
}

const Inner = () => {
  const session = useSession();

  useEffect(() => {
    if (session.status === "authenticated") {
      redirect("/users/me");
    }
  }, [session.status]);

  return (
    <div className="h-screen w-full">
      <div className="flex h-full flex-row items-center justify-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-[5rem]">
            Accountabili
            <span className="text-[hsl(280,100%,70%)]">buddies</span>
          </h1>

          {session.status === "unauthenticated" && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex flex-col items-center justify-center gap-4">
                <Link
                  href="/api/auth/signin"
                  className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
                >
                  Sign in
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
