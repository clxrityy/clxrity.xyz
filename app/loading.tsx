"use client";

import { useSessionContextState } from "@/hooks/useSessionContextState";
import { useRef } from "react";

export default function Loading() {
  const ref = useRef<HTMLElement>(null);

  const {
    settings: { wallpaper },
    useWallpaper,
  } = useSessionContextState();

  useWallpaper(ref, wallpaper);

  return <main ref={ref} />;
}
