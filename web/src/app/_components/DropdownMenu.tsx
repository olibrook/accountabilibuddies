import React, { useState } from "react";
import {
  Icon,
  KeyGroup,
  KeyGroupIcon,
  KeyGroupName,
} from "@buds/app/_components/TracksPage";

interface DropdownMenuProps {
  selectedKeyGroup: KeyGroup;
  keyGroups: KeyGroup[];
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  selectedKeyGroup,
  keyGroups,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative z-10">
      <div
        onClick={toggleDropdown}
        className="flex flex-row items-center justify-between"
      >
        <div className="pr-2 text-xl">
          <KeyGroupName keyGroup={selectedKeyGroup} />
        </div>
        <div className="relative">
          <div className="absolute left-[3px] z-0">
            <Icon fallback={"?"} alt={"?"} size="lg" />
          </div>
          <div className="absolute left-[6px] z-0">
            <Icon fallback={"?"} alt={"?"} size="lg" />
          </div>
          <div className="absolute left-[9px] z-0">
            <Icon fallback={"?"} alt={"?"} size="lg" />
          </div>
          <div className="relative z-20">
            <KeyGroupIcon keyGroup={selectedKeyGroup} size="lg" />
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded border bg-white shadow-lg">
          {keyGroups.map((keyGroup) => {
            if (keyGroup === selectedKeyGroup) {
              return false;
            }
            return (
              <div
                key={keyGroup.sortKey.key}
                className="flex h-full w-full flex-row items-center justify-between px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
              >
                <div className="mr-4 overflow-hidden overflow-ellipsis whitespace-nowrap">
                  <KeyGroupName keyGroup={keyGroup} />
                </div>
                <KeyGroupIcon keyGroup={keyGroup} size="lg" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
