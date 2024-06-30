import React, { createContext, ReactNode, useContext, useEffect } from "react";
import { SessionProvider, signIn, useSession } from "next-auth/react";
import { redirect, usePathname } from "next/navigation";
import { userIsOnboarded } from "@buds/shared/utils";
import { api } from "@buds/trpc/react";
import { RouterOutputs } from "@buds/trpc/shared";

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
  const pathname = usePathname();
  const excluded = ["/"];
  const isExcluded = excluded.indexOf(pathname) >= 0;
  if (!me && !isExcluded) {
    return null;
  }
  return (
    <CurrentUserContext.Provider value={me}>
      {children}
    </CurrentUserContext.Provider>
  );
};

const AuthGuard: React.FC<React.PropsWithChildren> = ({ children }) => {
  const pathname = usePathname();
  const session = useSession();
  const authenticated = session.status === "authenticated";
  const excluded = ["/"];
  const isExcluded = excluded.indexOf(pathname) >= 0;

  useEffect(() => {
    const checkSession = async () => {
      if (!isExcluded && session.status === "unauthenticated") {
        await signIn(undefined, { callbackUrl: pathname });
      }
    };
    void checkSession();
  }, [session.status, pathname]);

  if (authenticated || isExcluded) {
    return <>{children}</>;
  } else {
    return null;
  }
};

const UserOnboardingGuard: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const pathname = usePathname();
  const session = useSession();
  const loading = session.status === "loading";
  const authenticated = session.status === "authenticated";
  const onboarded = authenticated && userIsOnboarded(session.data);
  const excluded = ["/", "/onboarding"];
  const isExcluded = excluded.indexOf(pathname) >= 0;

  useEffect(() => {
    const checkUser = () => {
      if (!isExcluded && !loading && !onboarded) {
        redirect("/onboarding");
      }
    };
    void checkUser();
  }, [isExcluded, loading, onboarded]);

  if (onboarded || isExcluded) {
    return <>{children}</>;
  } else {
    return null;
  }
};

export const BaseAppShell: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <SessionProvider>
      <AuthGuard>
        <CurrentUserProvider>
          <UserOnboardingGuard>
            <div
              className={` flex h-screen items-center justify-center font-light`}
            >
              <div className="h-full w-full max-w-screen-md overflow-hidden border-red-500 bg-gray-50 font-light text-gray-600 md:h-[calc(100vh-theme(spacing.24))] md:rounded-2xl">
                {children}
              </div>
            </div>
          </UserOnboardingGuard>
        </CurrentUserProvider>
      </AuthGuard>
    </SessionProvider>
  );
};

const AppShell: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <BaseAppShell>{children}</BaseAppShell>;
};

export default AppShell;
