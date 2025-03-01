"use client";
import { useSessionContextState } from "@/hooks/useSessionContextState";
import { useRef } from "react";

export const Desktop = ({ children }: { children: React.ReactNode }) => {
  const desktopRef = useRef<HTMLElement>(this!);

  const {
    settings: { wallpaper },
    useWallpaper,
  } = useSessionContextState();

  useWallpaper(desktopRef, wallpaper);

  return (
    <main
      ref={desktopRef}
      className="h-screen w-screen fixed top-0 bottom-0 right-0 left-0 bg-inherit"
    >
      {children}
    </main>
  );
};
