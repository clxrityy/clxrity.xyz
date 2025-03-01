import NET from "vanta/dist/vanta.net.min";
import * as THREE from "three";
import { RefObject, useEffect } from "react";

export const useWallpaper = ({
  refElement,
}: {
  refElement: RefObject<HTMLElement | null>;
}): void => {
  useEffect(() => {
    const vantaEffect = NET({
      el: refElement && refElement.current,
      THREE,
      mouseControls: false,
      touchControls: false,
      gyroControls: false,
      minHeight: 200.0,
      minWidth: 200.0,
      scale: 1.0,
      scaleMobile: 1.0,
      color: 0x969696,
      backgroundColor: 0x111111,
      maxDistance: 13.0,
      spacing: 20.0,
    });

    return () => vantaEffect.destroy();
  }, [refElement]);
};
