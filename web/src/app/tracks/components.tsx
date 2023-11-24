import React from "react";

interface HexagonProps {
  hexagonColor: string;
  emoji: string;
}

export const Hexagon: React.FC<HexagonProps> = ({ hexagonColor, emoji }) => (
  <div className="relative h-12 w-12 overflow-hidden">
    <svg
      className={`absolute inset-0 h-full w-full fill-indigo-100`}
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      width="20"
      height="20"
      viewBox="0 0 300 300"
    >
      <polygon points="300,150 225,280 75,280 0,150 75,20 225,20"></polygon>
    </svg>

    <div className="relative flex h-full w-full items-center justify-center text-xl font-bold text-white">
      {emoji}
    </div>
  </div>
);

export default Hexagon;
