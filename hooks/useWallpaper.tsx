import NET from "vanta/dist/vanta.net.min";
import * as THREE from "three";
import { RefObject, useEffect } from "react";

export type WallpaperSettings = {
  mouseControls?: boolean;
  touchControls?: boolean;
  gyroControls?: boolean;
  minHeight?: number;
  minWidth?: number;
  scale?: number;
  scaleMobile?: number;
  color?: number;
  backgroundColor?: number;
  maxDistance?: number;
  spacing?: number;
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
};


export const useWallpaper = ({
  refElement,
  settings = initialWallpaperSettings,
}: {
  refElement: RefObject<HTMLElement | null>;
  settings?: WallpaperSettings;
}): void => {

  const isWebGLAvailable: boolean = typeof WebGLRenderingContext !== "undefined";

  useEffect(() => {
    const vantaEffect = isWebGLAvailable ? NET({
      el: refElement && refElement.current,
      THREE,
      ...settings
    }) : undefined;

    return () => vantaEffect?.destroy();
  }, [refElement, settings, isWebGLAvailable]);
};
