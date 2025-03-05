/* eslint-disable prettier/prettier */
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
  showDots?: boolean;
};

const defineThree = (three: typeof THREE) => {
  const { Material } = three;

  const material = new Material();

  material.vertexColors = true;

  return {
    ...three,
    Material: material,
  };
};

export const useWallpaperHook = ({
  desktopRef,
  settings,
}: {
  desktopRef: RefObject<HTMLElement | null>;
  settings?: WallpaperSettings;
}): void => {
  const isWebGLAvailable: boolean =
    typeof WebGLRenderingContext !== "undefined";

  useEffect(() => {
    const vantaEffect =
      isWebGLAvailable && desktopRef
        ? NET({
          el: desktopRef.current,
          THREE: defineThree(THREE),
          ...settings,
        })
        : undefined;

    return () => vantaEffect?.destroy();
  }, [desktopRef, settings, isWebGLAvailable]);
};
