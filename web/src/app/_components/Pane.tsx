import React from "react";
import { Search, Settings, Users } from "react-feather";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@buds/app/_components/TracksPage";
import { api } from "@buds/trpc/react";
import { AnimatePresence, motion } from "framer-motion";
import { FaRegEdit } from "react-icons/fa";

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
        <Link href="/app/users/me">
          <Avatar size="s" userName={me.name ?? ""} imageUrl={me.image} />
        </Link>
      </div>
      <div className={linkClasses("/users/me")}>
        <Link href="/app/habits">
          <FaRegEdit size={20} />
        </Link>
      </div>

      <div className={linkClasses("/tracks")}>
        <Link href="/app/tracks">
          <Users size={20} />
        </Link>
      </div>
      <div className={linkClasses("/search")}>
        <Link href="/app/search">
          <Search size={20} />
        </Link>
      </div>
      <div className={linkClasses("/settings")}>
        <Link href="/app/settings">
          <Settings size={20} />
        </Link>
      </div>
    </div>
  );
};

const MobileHeader: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex h-full w-full items-center justify-between bg-coral font-normal text-white">
      <h1 className="my-2 -rotate-3 pl-4 font-pacifico text-4xl tracking-tight drop-shadow-md">
        Bilibuddies
      </h1>
      {children}
    </div>
  );
};

export const Pane = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden shadow-xl drop-shadow-xl">
      <div className="h-20 w-full shrink-0 grow-0 overflow-hidden">
        <MobileHeader />
      </div>

      {children}

      <div className="h-16 w-full shrink-0 grow-0 overflow-hidden">
        <MobileFooter />
      </div>
    </div>
  );
};

export const MainContent = ({
  id,
  children,
}: {
  id?: string;
  children?: React.ReactNode;
}) => (
  <div id={id} className="h-full w-full shrink grow overflow-auto">
    {children}
  </div>
);

export const DefaultMainContentAnimation = ({
  children,
}: {
  children?: React.ReactNode;
}) => (
  <AnimatePresence>
    <motion.div
      className="h-full w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);
