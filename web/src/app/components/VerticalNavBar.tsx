// src/components/VerticalNavbar.tsx
import React from 'react';
import { Menu, MessageCircle, Settings } from 'react-feather';
import HamburgerMenu from './HamburgerMenu';

const VerticalNavbar: React.FC = () => {
    return (
        <nav className="bg-gray-800 w-16 h-screen fixed flex flex-col items-center">
            <a
                href="#"
                className="text-white p-4 my-2 hover:bg-gray-700 focus:outline-none"
            >
                <Menu size={20} />
            </a>
            <a
                href="#"
                className="text-white p-4 my-2 hover:bg-gray-700 focus:outline-none"
            >
                <MessageCircle size={20} />
            </a>
            <a
                href="#"
                className="text-white p-4 my-2 hover:bg-gray-700 focus:outline-none"
            >
                <Settings size={20} />
            </a>
        </nav>
    );
};

export default VerticalNavbar;
