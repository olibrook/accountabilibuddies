// src/components/AppShell.tsx
import React, { useState } from 'react';
import { Home, Users, Activity, X, Menu } from 'react-feather';


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
        <div className="flex flex-col h-screen font-normal">
            {/* Hamburger Menu */}
            <div
                className="fixed top-0 left-0 p-4 cursor-pointer z-10"
                onClick={toggleMenu}
            >
                <Menu size={20} />
            </div>

            {/* Content */}
            <div className="flex-1 font-light">
                {children}
            </div>

            {/* Bottom Navbar */}
            <nav className="fixed bottom-0 left-0 w-full flex justify-around bg-gray-800 p-4 z-10">
                <a href="#" className="text-white flex flex-col items-center">
                    <Home size={20} />
                    Profile
                </a>
                <a href="#" className="text-white flex flex-col items-center">
                    <Users size={20} />
                    Friends
                </a>
                <a href="#" className="text-white flex flex-col items-center">
                    <Activity size={20} />
                    Activity
                </a>
            </nav>

            {/* Hamburger Menu Slider */}
            <div
                className={`fixed top-0 left-0 h-full w-64 ${isMenuOpen ? "translate-x-0" : "-translate-x-64"} bg-gray-800 pb-4 pt-12 z-20 transition-transform duration-300 ease-in-out`}
            >
                {/* Close Button */}

                <div
                    className="absolute top-0 left-0 p-4 cursor-pointer z-10 text-white"
                    onClick={closeMenu}
                >
                    <X size={20} />
                </div>

                {/* Your menu items go here */}
                <a
                    href="#"
                    className="text-white block mb-2 flex items-center py-2 hover:bg-gray-700 px-4"
                >
                    <Home size={20} className="mr-2" />
                    Menu Item 1
                </a>
                <a
                    href="#"
                    className="text-white block mb-2 flex items-center py-2 hover:bg-gray-700 px-4"
                >
                    <Users size={20} className="mr-2" />
                    Menu Item 2
                </a>
                <a
                    href="#"
                    className="text-white block mb-2 flex items-center py-2 hover:bg-gray-700 px-4"
                >
                    <Activity size={20} className="mr-2" />
                    Menu Item 3
                </a>

            </div>
        </div>
    );
};

export default AppShell;
