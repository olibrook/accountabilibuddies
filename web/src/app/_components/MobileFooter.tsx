import React from "react";
import { Search, Settings, User, Users } from "react-feather";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MobileFooter = () => {
  const pathname = usePathname();

  const linkClasses = (path: string) =>
    `link-class hover:text-black ${
      pathname === path ? "text-black" : "text-gray-400"
    }`;

  return (
    <div className="fixed bottom-0 flex w-full items-center justify-around bg-white py-4">
      <div className={linkClasses("/users/me")}>
        <Link href="/users/me">
          <User size={20} />
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

export default MobileFooter;
