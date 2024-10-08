"use client";

import React, { createContext, ReactNode, useContext } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { api } from "@buds/trpc/react";
import { RouterOutputs } from "@buds/trpc/shared";
import { Pane } from "@buds/app/_components/Pane";
import { LoginButton } from "@buds/app/_components/LoginButton";
import { Onboarding } from "@buds/app/_components/Onboarding";

export const ToggleButton = ({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) => {
  return (
    <div className="flex w-full flex-row items-center justify-between">
      <div className="text-sm font-medium">{label}</div>
      <label className="relative inline-flex cursor-pointer items-center">
        <div>
          <input
            type="checkbox"
            checked={value}
            className="peer sr-only"
            onChange={() => onChange(!value)}
          />
          <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-gray-50 after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rtl:peer-checked:after:-translate-x-full dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
        </div>
      </label>
    </div>
  );
};

export type CurrentUser = RouterOutputs["user"]["me"];
export const CurrentUserContext = createContext<CurrentUser | undefined>(
  undefined,
);

export const useCurrentUser = () => {
  const me = useContext(CurrentUserContext);
  if (me === undefined) {
    throw new Error(
      "useUserSettings must be used within a UserSettingsProvider",
    );
  }
  return me;
};

export const CurrentUserProvider = ({ children }: { children: ReactNode }) => {
  const { data: me } = api.user.me.useQuery();
  if (!me) {
    return null;
  }
  return (
    <CurrentUserContext.Provider value={me}>
      {children}
    </CurrentUserContext.Provider>
  );
};

const AuthGuard: React.FC<React.PropsWithChildren> = ({ children }) => {
  const session = useSession();
  const authenticated = session.status === "authenticated";

  if (authenticated) {
    return <>{children}</>;
  } else {
    return <LoginButton />;
  }
};

const UserOnboardingGuard: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const session = useSession();
  const loading = session.status === "loading";
  const authenticated = session.status === "authenticated";

  const { data: me } = api.user.me.useQuery(undefined, {
    enabled: authenticated,
  });
  const onboarded = me && Boolean(me.username);

  if (loading) {
    return null;
  } else if (onboarded) {
    return <>{children}</>;
  } else {
    return <Onboarding />;
  }
};

export const BasicPage: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className={` flex h-screen items-center justify-center font-light`}>
    {children}
  </div>
);

export const AppPage: React.FC<React.PropsWithChildren> = ({ children }) => (
  <SessionProvider>
    <AuthGuard>
      <CurrentUserProvider>
        <UserOnboardingGuard>
          <BasicPage>
            <div className="h-full w-full max-w-screen-md overflow-hidden border-red-500 bg-gray-50 font-light text-gray-600 md:h-[calc(100vh-theme(spacing.24))] md:rounded-2xl">
              <Pane>{children}</Pane>
            </div>
          </BasicPage>
        </UserOnboardingGuard>
      </CurrentUserProvider>
    </AuthGuard>
  </SessionProvider>
);

export const AppShell: React.FC<React.PropsWithChildren> = ({ children }) => {
  const pathName = usePathname();
  if (pathName.startsWith("/app")) {
    return <AppPage>{children}</AppPage>;
  } else {
    return <BasicPage>{children}</BasicPage>;
  }
};
