"use client";

import { useEffect } from "react";

const SECOND_IN_MS = 1000;

export const useSyncedClock = (callback: () => void): void => {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      callback();
    }, SECOND_IN_MS - new Date().getMilliseconds());

    setInterval(callback, SECOND_IN_MS);

    return () => clearTimeout(timeoutId);
  }, [callback]);
};
