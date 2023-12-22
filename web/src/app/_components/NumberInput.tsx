import React from "react";

type Props = {
  value?: number;
  min?: number;
  max?: number;
  onChange: (val?: number) => void;
  incr: number;
  unit: string;
};

export const NumberInput: React.FC<Props> = ({
  value,
  min,
  max,
  onChange,
  incr,
  unit,
}) => {
  return (
    <div className="h-full w-full text-8xl">
      <label htmlFor="bedrooms-input" className="sr-only">
        Choose bedrooms number:
      </label>
      <div className="relative flex h-full items-center">
        <button
          type="button"
          id="decrement-button"
          data-input-counter-decrement="bedrooms-input"
          className="h-full rounded-s-lg border border-gray-300 bg-gray-100 p-3 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700"
          onClick={() => onChange((value ?? 0) - incr)}
        >
          <svg
            className="h-3 w-3 text-gray-900 dark:text-white"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 18 2"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M1 1h16"
            />
          </svg>
        </button>
        <input
          type="number"
          className="block h-full w-full border-x-0 border-gray-300 bg-gray-50 pb-6 text-center font-medium text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
          value={value ?? ""}
          onChange={(e) =>
            onChange(!!e.target.value ? Number(e.target.value) : undefined)
          }
          min={min}
          max={max}
        />
        <div className="absolute bottom-1 start-1/2 flex -translate-x-1/2 items-center space-x-1 text-xs text-gray-400 rtl:translate-x-1/2 rtl:space-x-reverse">
          <span>{unit}</span>
        </div>
        <button
          type="button"
          id="increment-button"
          data-input-counter-increment="bedrooms-input"
          className="h-full rounded-e-lg border border-gray-300 bg-gray-100 p-3 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700"
          onClick={() => onChange((value ?? 0) + incr)}
        >
          <svg
            className="h-3 w-3 text-gray-900 dark:text-white"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 18 18"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 1v16M1 9h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
