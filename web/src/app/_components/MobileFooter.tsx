import React from "react";
import { Heart, Home, PlusSquare, Search, User } from "react-feather";

const MobileFooter = () => {
  return (
    <div className="fixed bottom-0 flex w-full items-center justify-around bg-white py-4">
      <div className="text-gray-500 hover:text-black">
        <Home size={20} />
      </div>
      <div className="text-gray-500 hover:text-black">
        <Search size={20} />
      </div>
      <div className="text-gray-500 hover:text-black">
        <PlusSquare size={20} />
      </div>
      <div className="text-gray-500 hover:text-black">
        <Heart size={20} />
      </div>
      <div className="text-gray-500 hover:text-black">
        <User size={20} />
      </div>
    </div>
  );
};

export default MobileFooter;
