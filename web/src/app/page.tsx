"use client";
import { MainContent } from "@buds/app/_components/Pane";
import { useEffect } from "react";
import { redirect } from "next/navigation";

export default function Home() {
  useEffect(() => {
    redirect("/users/me");
  });
  return <MainContent />;
}
