import {
  type SessionProcesses,
  type Theme,
  type SessionContextState,
} from "@/contexts/session/session";
import { useWallpaperHook } from "../../hooks/useWallpaper";
import { initialSessionContextState, initialWallpaperSettings } from "@/config";
import { create } from "zustand";

export const useSessionStore = create<SessionContextState>((set, get) => ({
  data: {},
  settings: {
    ...initialSessionContextState.settings,
    wallpaper: initialWallpaperSettings,
  },
  setTheme: (theme: Theme) =>
    set((state) => ({
      ...state,
      settings: {
        ...state.settings,
        theme,
      },
    })),
  useWallpaper: (desktopRef, settings) =>
    useWallpaperHook({
      desktopRef,
      settings,
    }),
  setSettings: (settings) =>
    set((state) => ({
      ...state,
      settings: { ...state.settings, ...settings },
    })),
  currentProcesses: {},
  setCurrentProcesses: (currentProcesses: SessionProcesses) => {
    set((state) => ({
      ...state,
      currentProcesses,
    }));
    return get().currentProcesses;
  },
}));
