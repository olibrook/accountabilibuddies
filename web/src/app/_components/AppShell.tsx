import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Activity, Home, Users, X } from "react-feather";
import MobileFooter from "@buds/app/_components/MobileFooter";
import { SessionProvider, signIn, useSession } from "next-auth/react";
import { redirect, usePathname } from "next/navigation";
import { userIsOnboarded } from "@buds/shared/utils";

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

export type Measurement = "metric" | "imperial";

export type UserSettings = {
  measurements: Measurement;
  checkIcon: string;
};
export const defaultUserSettings: UserSettings = {
  measurements: "metric",
  checkIcon: "⭐",
};

export type UserSettingsContextType = {
  settings: UserSettings;
  setUserSettings: (settings: UserSettings) => void;
};
export const defaultUserSettingsContext = {
  settings: defaultUserSettings,
  setUserSettings: () => {
    return;
  },
};
export const UserSettingsContext = createContext<UserSettingsContextType>(
  defaultUserSettingsContext,
);

export const UserSettingProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setUserSettings] =
    useState<UserSettings>(defaultUserSettings);
  return (
    <UserSettingsContext.Provider value={{ settings, setUserSettings }}>
      {children}
    </UserSettingsContext.Provider>
  );
};

export type LeftSliderProps = {
  closeMenu: () => void;
};

export const LeftSlider: React.FC<LeftSliderProps> = ({ closeMenu }) => {
  const { settings, setUserSettings } = useContext(UserSettingsContext);

  const displayMetric = settings.measurements === "metric";

  const setDisplayMetric = (useMetric: boolean) =>
    setUserSettings({
      ...settings,
      measurements: useMetric ? "metric" : "imperial",
    });

  const toggleStarHeart = (useStar: boolean) =>
    setUserSettings({
      ...settings,
      checkIcon: useStar ? "⭐" : "💖",
    });

  return (
    <div>
      <div
        className="absolute left-0 top-0 z-10 cursor-pointer p-4"
        onClick={closeMenu}
      >
        <X size={20} />
      </div>

      <a
        href="#"
        className="mb-2 block flex items-center px-4 py-2 hover:bg-gray-700"
      >
        <Home size={20} className="mr-2" />
        Menu Item 1
      </a>
      <a
        href="#"
        className="mb-2 block flex items-center px-4 py-2 hover:bg-gray-700"
      >
        <Users size={20} className="mr-2" />
        Menu Item 2
      </a>
      <a
        href="#"
        className="mb-2 block flex items-center px-4 py-2 hover:bg-gray-700"
      >
        <Activity size={20} className="mr-2" />
        Menu Item 3
      </a>

      <h2 className="my-4 px-4">Settings</h2>

      <div className="mb-2 block flex items-center px-4 py-2 hover:bg-gray-700">
        <ToggleButton
          value={settings.checkIcon === "⭐"}
          onChange={toggleStarHeart}
          label="💖/⭐"
        />
      </div>
      <div className="mb-2 block flex items-center px-4 py-2 hover:bg-gray-700">
        <ToggleButton
          value={displayMetric}
          onChange={setDisplayMetric}
          label="Use metric?"
        />
      </div>
    </div>
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
  const excluded = ["/", "/settings"];
  const isExcluded = excluded.indexOf(pathname) >= 0;

  useEffect(() => {
    const checkUser = () => {
      if (!isExcluded && !loading && !onboarded) {
        redirect("/settings");
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
  const hiPerf = true;
  const bg = hiPerf
    ? "bg-cover	bg-no-repeat bg-gradient-to-bl from-[#FED5B6] to-[#7371B5]"
    : "bg-[#FED5B6]";
  return (
    <SessionProvider>
      <UserSettingProvider>
        <AuthGuard>
          <UserOnboardingGuard>
            <div className={`${bg} h-screen`}>{children}</div>
          </UserOnboardingGuard>
        </AuthGuard>
      </UserSettingProvider>
    </SessionProvider>
  );
};

const AppShell: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <BaseAppShell>
      <div className="flex flex-col font-normal">
        <div className="flex-1 font-light">{children}</div>
      </div>
      <MobileFooter />
    </BaseAppShell>
  );
};

export default AppShell;
