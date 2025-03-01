"use client";
import { useWallpaper } from "@/hooks/useWallpaper";
import { useRef } from "react";

export const Desktop = ({ children }: { children: React.ReactNode }) => {
  const desktopRef = useRef<HTMLElement>(null);

  useWallpaper({ refElement: desktopRef });

  return (
    <main
      ref={desktopRef}
      className="h-screen w-screen fixed top-0 bottom-0 right-0 left-0 bg-inherit"
    >
      {children}
    </main>
  );
};
