// src/components/AppShell.tsx
import React, { createContext, ReactNode, useContext, useState } from "react";
import { Activity, Home, Menu, Users, X } from "react-feather";

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
    <label className="relative inline-flex cursor-pointer items-center">
      <input
        type="checkbox"
        checked={value}
        className="peer sr-only"
        onChange={() => onChange(!value)}
      />
      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-gray-50 after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rtl:peer-checked:after:-translate-x-full dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
      <span className="ms-3 text-sm font-medium">{label}</span>
    </label>
  );
};

export type Measurement = "metric" | "imperial";

export type UserSettings = {
  measurements: Measurement;
  checkIcon: string;
  groupByUser: boolean;
};
export const defaultUserSettings: UserSettings = {
  measurements: "metric",
  checkIcon: "⭐",
  groupByUser: true,
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

  const setGroupByUser = (val: boolean) =>
    setUserSettings({
      ...settings,
      groupByUser: val,
    });

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
      <div className="mb-2 block flex items-center px-4 py-2 hover:bg-gray-700">
        <ToggleButton
          value={settings.groupByUser}
          onChange={() => setGroupByUser(!settings.groupByUser)}
          label="Track/User"
        />
      </div>
    </div>
  );
};

type AppShellProps = {
  children: React.ReactNode;
};

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <UserSettingProvider>
      <div className="flex flex-col font-normal">
        {/* Hamburger Menu */}
        <div
          className="fixed left-0 top-0 z-10 cursor-pointer p-4"
          onClick={toggleMenu}
        >
          <Menu size={20} />
        </div>

        {/* Content */}
        <div className="flex-1 font-light">{children}</div>

        {/* Bottom Navbar */}
        <nav className="fixed bottom-0 left-0 z-10 flex w-full justify-around bg-gray-800 p-2 text-xs">
          <a href="#" className="flex flex-col items-center text-white">
            <Home size={16} />
            Profile
          </a>
          <a href="#" className="flex flex-col items-center text-white">
            <Users size={16} />
            Friends
          </a>
          <a href="#" className="flex flex-col items-center text-white">
            <Activity size={16} />
            Activity
          </a>
        </nav>

        {/* Hamburger Menu Slider */}
        <div
          className={`fixed left-0 top-0 h-full w-64 ${
            isMenuOpen ? "translate-x-0" : "-translate-x-64"
          } z-20 bg-gray-800 pb-4 pt-12 text-white transition-transform duration-300 ease-in-out`}
        >
          <LeftSlider closeMenu={closeMenu} />
        </div>
      </div>
    </UserSettingProvider>
  );
};

export default AppShell;
