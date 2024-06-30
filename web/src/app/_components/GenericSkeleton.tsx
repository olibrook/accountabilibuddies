import React from "react";

export const GenericSkeleton = () => (
  <div className="flex h-full w-full flex-col gap-4 p-4">
    <div className="skeleton h-4 w-28"></div>
    <div className="skeleton h-4 w-full"></div>
    <div className="skeleton h-4 w-full"></div>
    <div className="skeleton h-4 w-full"></div>
    <div className="skeleton h-4 w-full"></div>
    <div className="skeleton h-4 w-1/2"></div>
    <div className="skeleton h-32 w-full grow"></div>
  </div>
);