import "@buds/styles/globals.css";

import { Inter } from "next/font/google";
import { cookies } from "next/headers";

import { TRPCReactProvider } from "@buds/trpc/react";
import { ServiceWorkerInstaller } from "@buds/app/_components/ServiceWorkerInstaller";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Bilibuddies",
  description: "Friends keep you accountable.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`font-sans ${inter.variable} bg-app-bg-image bg-cover bg-no-repeat`}
      >
        <TRPCReactProvider cookies={cookies().toString()}>
          {children}
        </TRPCReactProvider>
        <ServiceWorkerInstaller />
      </body>
    </html>
  );
}
