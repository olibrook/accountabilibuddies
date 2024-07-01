"use client";

import { getProviders, signIn, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { DefaultMainContentAnimation } from "@buds/app/_components/Pane";
import { FcGoogle } from "react-icons/fc";

type Providers = Awaited<ReturnType<typeof getProviders>>;

const useProviders = () => {
  const [providers, setProviders] = useState<Providers | null>(null);
  useEffect(() => {
    const inner = async () => {
      const _providers = await getProviders();
      setProviders(_providers);
    };
    void inner();
  }, []);
  return providers;
};

export const LoginButton = () => {
  const providers = useProviders();
  const session = useSession();

  useEffect(() => {
    if (session.status === "authenticated") {
      redirect("/users/me");
    }
  }, [session.status]);

  const shouldRender =
    session.status === "unauthenticated" && providers !== null;

  const icons: { [k: string]: React.ReactNode } = {
    Google: <FcGoogle size="25" />,
  };

  return (
    <div className=" h-screen w-full">
      {shouldRender && (
        <DefaultMainContentAnimation>
          <div className="flex h-full w-full flex-col items-center justify-center gap-8">
            <div className="flex h-full max-h-[300px] w-full max-w-[300px] flex-col items-center justify-center overflow-hidden rounded-full bg-coral py-3 text-center text-white">
              <h1 className="-rotate-3 font-pacifico text-6xl tracking-tight drop-shadow-md">
                Bilibuddies
              </h1>
            </div>
            {Object.values(providers).map((provider) => (
              <div key={provider.name} className="font-bold">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    void signIn(provider.id);
                  }}
                  className="flex items-center justify-around gap-2 rounded-full bg-white/30 px-10 py-3 no-underline transition hover:bg-white/50"
                >
                  {icons[provider.name] ?? null}
                  <span>Sign in with {provider.name}</span>
                </button>
              </div>
            ))}
          </div>
        </DefaultMainContentAnimation>
      )}
    </div>
  );
};
