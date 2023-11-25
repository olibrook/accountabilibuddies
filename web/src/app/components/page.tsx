"use client";


import AppShell from "./AppShell";


export default function Page() {
    const hiPerf = true;
    const bg = hiPerf ? "bg-gradient-to-bl from-[#FED5B6] to-[#7371B5]" : "bg-[#FED5B6]"

    return (
        <main className={`${bg}`}>
            <AppShell />
        </main>
    );
}

