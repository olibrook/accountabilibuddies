import React from "react";
import { Search, Settings, User, Users } from "react-feather";
import Link from "next/link";

const MobileFooter = () => {
  return (
    <div className="fixed bottom-0 flex w-full items-center justify-around bg-white py-4">
      <div className="text-gray-500 hover:text-black">
        <Link href="/users/me">
          <User size={20} />
        </Link>
      </div>
      <div className="text-gray-500 hover:text-black">
        <Link href="/tracks">
          <Users size={20} />
        </Link>
      </div>
      <div className="text-gray-500 hover:text-black">
        <Link href="/search">
          <Search size={20} />
        </Link>
      </div>
      <div className="text-gray-500 hover:text-black">
        <Link href="/settings">
          <Settings size={20} />
        </Link>
      </div>
    </div>
  );
};

export default MobileFooter;
