"use client";

import { Dispatch, SetStateAction } from "react";
import { initialSessionContextState } from "./initialStates";
import { contextFactory } from "../util/contextFactory";
import { useSessionContextState } from "@/hooks/useSessionContextState";
import { WallpaperSettings } from "@/hooks/useWallpaper";

export type Theme = "dark" | "system" | "light";

export type SessionContextState = {
  data: {
    [key: string]: string;
  };
  settings: {
    theme: Theme;
    wallpaper: WallpaperSettings;
  };
  setTheme: ((theme: Theme) => void) | Dispatch<SetStateAction<Theme>>;
  useWallpaper: (
    desktopRef: React.RefObject<HTMLElement>,
    settings?: WallpaperSettings,
  ) => void;
};

const { Consumer, Provider } = contextFactory<SessionContextState>(
  initialSessionContextState,
  useSessionContextState,
);

export { Consumer as SessionConsumer, Provider as SessionProvider };
