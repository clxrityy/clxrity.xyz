"use client";

import { Dispatch, SetStateAction } from "react";
import { initialSessionContextState } from "./initialStates";
import { contextFactory } from "../util/contextFactory";
import { useSession } from "@/hooks/useSession";
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
    desktopRef: React.RefObject<HTMLElement | null>,
    settings?: WallpaperSettings,
  ) => void;
};

const { Consumer, Provider, useContext } = contextFactory<SessionContextState>(
  initialSessionContextState,
  useSession,
);

export {
  Consumer as SessionConsumer,
  Provider as SessionProvider,
  useContext as useSession,
};
