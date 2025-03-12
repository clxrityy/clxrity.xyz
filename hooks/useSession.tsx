import { Theme, type SessionContextState } from "@/context/session";
import { useWallpaperHook } from "./useWallpaper";
import { initialSessionContextState, initialWallpaperSettings } from "@/config";
import { create } from "zustand";

export const useSessionStore = create<SessionContextState>((set) => ({
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
}));
