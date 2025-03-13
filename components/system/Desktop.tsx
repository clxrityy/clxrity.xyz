"use client";
import { useSession } from "@/contexts/session";
import { useRef } from "react";

export const Desktop = ({ children }: { children: React.ReactNode }) => {
  const desktopRef = useRef<HTMLElement>(this!);

  const {
    settings: { wallpaper },
    useWallpaper,
  } = useSession();

  useWallpaper(desktopRef, wallpaper);

  return (
    <main
      role="main"
      ref={desktopRef}
      className="h-screen w-screen fixed top-0 bottom-0 right-0 left-0 z-[30] bg-inherit"
    >
      {children}
    </main>
  );
};
