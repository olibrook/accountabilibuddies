// src/components/VerticalNavbar.tsx
import React from "react";
import { Menu, MessageCircle, Settings } from "react-feather";

const VerticalNavbar: React.FC = () => {
  return (
    <nav className="fixed flex h-screen w-16 flex-col items-center bg-gray-800">
      <a
        href="#"
        className="my-2 p-4 text-white hover:bg-gray-700 focus:outline-none"
      >
        <Menu size={20} />
      </a>
      <a
        href="#"
        className="my-2 p-4 text-white hover:bg-gray-700 focus:outline-none"
      >
        <MessageCircle size={20} />
      </a>
      <a
        href="#"
        className="my-2 p-4 text-white hover:bg-gray-700 focus:outline-none"
      >
        <Settings size={20} />
      </a>
    </nav>
  );
};

export default VerticalNavbar;
