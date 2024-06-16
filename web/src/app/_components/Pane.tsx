import React from "react";

export const Pane = ({
  popupChildren,
  headerChildren,
  mainChildren,
}: {
  popupChildren?: React.ReactNode;
  headerChildren?: React.ReactNode;
  mainChildren?: React.ReactNode;
}) => {
  return (
    <main className={`h-screen font-light text-gray-600`}>
      <div className="flex h-full w-full flex-col overflow-hidden bg-[#7371b5] shadow-xl drop-shadow-xl">
        {popupChildren}
        <div className="flex min-h-[4rem] items-center justify-end font-normal text-white ">
          {headerChildren}
        </div>
        <div className="h-full w-full rounded-b-xl bg-gray-50">
          {mainChildren}
        </div>
      </div>
    </main>
  );
};
