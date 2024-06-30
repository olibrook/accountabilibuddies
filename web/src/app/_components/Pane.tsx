import React from "react";
import { Search, Settings, Users } from "react-feather";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@buds/app/_components/TracksPage";
import { api } from "@buds/trpc/react";

const MobileFooter = () => {
  const { data: me } = api.user.me.useQuery();

  const pathname = usePathname();

  if (!me) {
    return null;
  }

  const linkClasses = (path: string) =>
    `link-class hover:text-black ${
      pathname === path ? "text-black" : "text-gray-400"
    }`;

  return (
    <div className="flex h-full w-full items-center justify-around bg-white py-4">
      <div className={linkClasses("/users/me")}>
        <Link href="/users/me">
          <Avatar size="s" userName={me.name ?? ""} imageUrl={me.image} />
        </Link>
      </div>
      <div className={linkClasses("/tracks")}>
        <Link href="/tracks">
          <Users size={20} />
        </Link>
      </div>
      <div className={linkClasses("/search")}>
        <Link href="/search">
          <Search size={20} />
        </Link>
      </div>
      <div className={linkClasses("/settings")}>
        <Link href="/settings">
          <Settings size={20} />
        </Link>
      </div>
    </div>
  );
};

const MobileHeader: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex h-full w-full items-center justify-between font-normal text-white ">
      <h1 className="font-pacifico my-2 -rotate-3 pl-4 text-4xl tracking-tight drop-shadow-md">
        Bilibuddies
      </h1>
      {children}
    </div>
  );
};

export const Pane = ({
  popupChildren,
  headerChildren,
  mainChildren,
}: {
  popupChildren?: React.ReactNode;
  headerChildren?: React.ReactNode;
  mainChildren?: React.ReactNode;
}) => {
  return (
    <div className="bg-coral flex h-full w-full flex-col overflow-hidden shadow-xl drop-shadow-xl">
      {popupChildren}

      <div className="h-20 w-full shrink-0 grow-0 overflow-hidden">
        <MobileHeader>{headerChildren}</MobileHeader>
      </div>

      <div
        id="pane-main-scrollable-div"
        className="h-full w-full shrink grow overflow-auto"
      >
        {mainChildren}
      </div>

      <div className="h-16 w-full shrink-0 grow-0 overflow-hidden">
        <MobileFooter />
      </div>
    </div>
  );
};
