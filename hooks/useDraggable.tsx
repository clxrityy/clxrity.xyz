"use client";
import { useCallback, useState } from "react";
import { RndDragCallback } from "react-rnd";

export type Position = {
  x: number;
  y: number;
};

const defaultPosition: Position = {
  x: 0,
  y: 0,
};

export type Draggable = Position & {
  updatePosition: RndDragCallback;
};

export const useDraggable = (maximized = false): Draggable => {
  const [{ x, y }, setPosition] = useState<Position>(defaultPosition);

  const updatePosition = useCallback<RndDragCallback>(
    (_event, { x: elementX, y: elementY }) => {
      if (x >= 0 && y >= 0) {
        setPosition({ x: elementX, y: elementY });
      }
    },
    [x, y],
  );

  return {
    x: maximized ? 0 : x,
    y: maximized ? 0 : y,
    updatePosition,
  };
};
