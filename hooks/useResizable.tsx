import { useCallback, useState } from "react";
import { RndResizeCallback } from "react-rnd";

export type Size = {
  height: string;
  width: string;
};

const defaultSize: Size = {
  height: "300px",
  width: "300px",
};

export type Resizable = Size & {
  updateSize: RndResizeCallback;
};

export const useResizable = (maximized = false): Resizable => {
  const [{ width, height }, setSize] = useState<Size>(defaultSize);

  const updateSize = useCallback<RndResizeCallback>(
    (
      _event,
      _direction,
      { style: { height: elementHeight, width: elementWidth } },
    ) => setSize({ height: elementHeight, width: elementWidth }),
    [],
  );

  return {
    width: maximized ? "100%" : width,
    height: maximized ? "100%" : height,
    updateSize,
  };
};
