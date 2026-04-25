"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPortalRoute = pathname === "/game" || pathname.startsWith("/game/");

  return (
    <>
      {isPortalRoute && <Navbar />}
      <main className="flex-1">{children}</main>
      {isPortalRoute && <Footer />}
    </>
  );
}
