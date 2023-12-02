// src/components/MenuSlider.tsx
import React from 'react';
import { X } from 'react-feather';
import { Transition } from '@headlessui/react';

interface MenuSliderProps {
    isOpen: boolean;
    onClose: () => void;
}

const MenuSlider: React.FC<MenuSliderProps> = ({ isOpen, onClose }) => {
    return (
        <Transition
            show={isOpen}
            enter="transition-transform duration-300 ease-in-out"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition-transform duration-300 ease-in-out"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
        >
            <div className="fixed top-0 left-0 h-full w-64 bg-gray-800 p-4 z-50">
                {/* Your menu items go here */}
                <a href="#" className="text-white block mb-2">
                    Menu Item 1
                </a>
                <a href="#" className="text-white block mb-2">
                    Menu Item 2
                </a>
                <a href="#" className="text-white block mb-2">
                    Menu Item 3
                </a>
                {/* Close Button */}
                <div
                    className="cursor-pointer text-white absolute top-4 right-4"
                    onClick={onClose}
                >
                    <X size={20} />
                </div>
            </div>
        </Transition>
    );
};

export default MenuSlider;
