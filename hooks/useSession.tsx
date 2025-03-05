import { type SessionContextState } from "@/context/session";
import { useWallpaperHook, type WallpaperSettings } from "./useWallpaper";
import { initialWallpaperSettings } from "@/config";

export const useSession = (): SessionContextState => ({
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
