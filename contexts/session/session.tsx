/* eslint-disable prettier/prettier */
"use client";

import { Dispatch, SetStateAction } from "react";
import { initialSessionContextState } from "../../config/initialStates";
import { contextFactory } from "../../util/contextFactory";
import { useSessionStore } from "@/contexts/session/useSession";
import { WallpaperSettings } from "@/hooks/useWallpaper";

export type Theme = "dark" | "system" | "light";

export type SessionProcess = {
  pid: string;
  position: {
    x: number;
    y: number;
  },
  size: {
    width: number | string;
    height: number | string;
  },
};

export type SessionProcesses = {
  [pid: string]: SessionProcess;
}

export type SessionContextState = {
  data: {
    [key: string]: string;
  };
  settings: {
    theme: Theme;
    wallpaper: WallpaperSettings;
    defaultProcessPosition: {
      x: number;
      y: number;
    };
    defaultProcessSize: {
      width: number | string;
      height: number | string;
    };
  };
  setTheme: ((theme: Theme) => void) | Dispatch<SetStateAction<Theme>>;
  useWallpaper: (
    desktopRef: React.RefObject<HTMLElement | null>,
    settings?: WallpaperSettings,
  ) => void;
  setSettings: (settings: Partial<SessionContextState["settings"]>) => void;
  currentProcesses: SessionProcesses;
  setCurrentProcesses: ((currentProcesses: SessionProcesses) => SessionProcesses) | Dispatch<SetStateAction<SessionProcesses>>;
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
