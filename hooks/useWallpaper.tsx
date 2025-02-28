import NET from "vanta/dist/vanta.net.min";
import * as THREE from "three";
import { RefObject, useEffect } from "react";

export const useWallpaper = ({ refElement }: { refElement: RefObject<HTMLElement> }): void => {

  useEffect(() => {
    const vantaEffect = NET({
      el: refElement.current,
      THREE,
      mouseControls: false,
      touchControls: false,
      gyroControls: false,
      minHeight: 200.00,
      minWidth: 200.00,
      scale: 1.00,
      scaleMobile: 1.00,
      color: 0x969696,
      backgroundColor: 0x111111,
      maxDistance: 13.00,
      spacing: 20.00,
    });


    return () => vantaEffect.destroy();

  }, [refElement]);
}
