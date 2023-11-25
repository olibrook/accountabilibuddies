
import React, { useState } from 'react';

const HamburgerMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div>
            <button
                className="text-white p-2 focus:outline-none"
                onClick={toggleMenu}
            >
                ☰
            </button>
            {isOpen && (
                <div className="absolute top-0 left-0 w-full h-full bg-gray-800 bg-opacity-75">
                    <div className="flex items-center justify-end p-4">
                        <button
                            className="text-white p-2 focus:outline-none"
                            onClick={toggleMenu}
                        >
                            ✕
                        </button>
                    </div>
                    {/* Your menu items go here */}
                </div>
            )}
        </div>
    );
};

export default HamburgerMenu;
