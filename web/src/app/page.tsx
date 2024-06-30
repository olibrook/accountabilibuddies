"use client";

import Link from "next/link";

import { BaseAppShell } from "@buds/app/_components/AppShell";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { LoadingSpinner } from "@buds/app/_components/LoadingSpinner";

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
        <div className="bg-coral w-full py-3 text-center text-white">
          <h1 className="font-pacifico my-2 -rotate-3 text-4xl tracking-tight drop-shadow-md">
            Bilibuddies
          </h1>

          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 flex-col items-center justify-center gap-4 font-bold">
              {session.status === "unauthenticated" ? (
                <Link
                  href="/api/auth/signin"
                  className="rounded-full bg-white/10 px-10 py-3 no-underline transition hover:bg-white/20"
                >
                  Sign in
                </Link>
              ) : (
                <LoadingSpinner />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
