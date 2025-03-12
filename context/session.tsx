"use client";

import { Dispatch, SetStateAction } from "react";
import { initialSessionContextState } from "../config/initialStates";
import { contextFactory } from "../util/contextFactory";
import { useSessionStore } from "@/hooks/useSession";
import { WallpaperSettings } from "@/hooks/useWallpaper";

export type Theme = "dark" | "system" | "light";

export type SessionContextState = {
  data: {
    [key: string]: string;
  };
  settings: {
    theme: Theme;
    wallpaper: WallpaperSettings;
    processPosition: {
      x: number | null;
      y: number | null;
    };
    processSize: {
      width: number | null;
      height: number | null;
    };
  };
  setTheme: ((theme: Theme) => void) | Dispatch<SetStateAction<Theme>>;
  useWallpaper: (
    desktopRef: React.RefObject<HTMLElement | null>,
    settings?: WallpaperSettings,
  ) => void;
};

const { Consumer, Provider, useContext } = contextFactory<SessionContextState>(
  initialSessionContextState,
  useSessionStore,
);

export {
  Consumer as SessionConsumer,
  Provider as SessionProvider,
  useContext as useSession,
};
