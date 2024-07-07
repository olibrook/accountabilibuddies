export const Calendar = ({
  year = "",
  month = "",
  className = "",
}: {
  year?: string;
  month?: string;
  className: string;
}) => {
  return (
    <div
      className={`flex h-12 w-12 flex-col overflow-hidden rounded-xl shadow ${className}`}
    >
      <div className="flex h-4 w-full shrink-0 grow-0 items-center justify-center bg-red-600 text-xs font-bold text-white">
        <span>{year}</span>
      </div>
      <div className="flex w-full shrink grow items-center justify-center bg-white text-lg font-bold text-black">
        <span className="-mt-1">{month}</span>
      </div>
    </div>
  );
};
