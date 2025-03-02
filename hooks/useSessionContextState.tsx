import { type SessionContextState } from "@/context/session";
import {
  initialWallpaperSettings,
  useWallpaperHook,
  WallpaperSettings,
} from "./useWallpaper";

export const useSessionContextState = (): SessionContextState => ({
  data: {},
  settings: {
    theme: "dark",
    wallpaper: initialWallpaperSettings,
  },
  setTheme() {
    this.setTheme(this.settings.theme);
  },
  useWallpaper(
    desktopRef: React.RefObject<HTMLElement | null>,
    settings?: WallpaperSettings,
  ) {
    useWallpaperHook({ desktopRef, settings });
  },
});
