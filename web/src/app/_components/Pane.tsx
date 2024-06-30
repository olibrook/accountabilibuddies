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
      <div className="bg-coral flex h-full w-full flex-col overflow-hidden shadow-xl drop-shadow-xl">
        {popupChildren}
        <div className="flex min-h-[4rem] items-center justify-between font-normal text-white ">
          <h1 className="font-pacifico my-2 -rotate-3 pl-2 text-3xl tracking-tight drop-shadow-md">
            Bilibuddies
          </h1>
          {headerChildren}
        </div>
        <div className="h-full w-full rounded-b-xl bg-gray-50">
          {mainChildren}
        </div>
      </div>
    </main>
  );
};
