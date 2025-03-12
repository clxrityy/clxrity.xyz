"use client";

import { useSession } from "@/contexts/session/session";
import { useRef } from "react";

export default function Loading() {
  const ref = useRef<HTMLElement>(null);

  const {
    settings: { wallpaper },
    useWallpaper,
  } = useSession();

  useWallpaper(ref, wallpaper);

  return <main ref={ref} />;
}
