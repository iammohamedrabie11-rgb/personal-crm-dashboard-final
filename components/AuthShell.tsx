"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { UndoRedoControls } from "@/components/UndoRedoControls";

function isAuthRoute(pathname: string) {
  return pathname === "/login" || pathname === "/signup" || pathname.startsWith("/auth/");
}

export function AuthShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (isAuthRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen lg:ml-64">
        <UndoRedoControls />
        {children}
      </div>
    </>
  );
}
