import { WallpaperSettings } from "@/hooks/useWallpaper";
import publicFyleSystemIndex from "@/public/public.json";
import type { FileSystemConfiguration } from "browserfs";

export const fileSystemConfig: FileSystemConfiguration = {
  fs: "OverlayFS",
  options: {
    readable: {
      fs: "XmlHttpRequest",
      options: {
        index: publicFyleSystemIndex,
      },
    },
    writable: {
      fs: "IndexedDB",
      options: {
        storeName: "browser-fs-cache",
      },
    },
  },
};

export const initialWallpaperSettings: WallpaperSettings = {
  mouseControls: false,
  touchControls: false,
  gyroControls: false,
  minHeight: 200.0,
  minWidth: 200.0,
  scale: 1.0,
  scaleMobile: 1,
  color: 6184542,
  backgroundColor: 0x111111,
  maxDistance: 17.5,
  spacing: 20.0,
  showDots: false,
};
