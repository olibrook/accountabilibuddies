"use client";

import Link from "next/link";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { DefaultMainContentAnimation } from "@buds/app/_components/Pane";

export const LoginButton = () => {
  const session = useSession();

  useEffect(() => {
    if (session.status === "authenticated") {
      redirect("/users/me");
    }
  }, [session.status]);

  return (
    <div className=" h-screen w-full">
      {session.status === "unauthenticated" && (
        <DefaultMainContentAnimation>
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex h-full max-h-[300px] w-full max-w-[300px] flex-col items-center justify-center overflow-hidden rounded-3xl bg-coral py-3 text-center text-white">
              <div className="flex flex-col gap-8">
                <h1 className="-rotate-3 font-pacifico text-6xl tracking-tight drop-shadow-md">
                  Bilibuddies
                </h1>

                <div className="font-bold">
                  <Link
                    href="/api/auth/signin"
                    className="rounded-full bg-white/10 px-10 py-3 no-underline transition hover:bg-white/20"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </DefaultMainContentAnimation>
      )}
    </div>
  );
};
