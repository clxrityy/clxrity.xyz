"use client";

import { SECOND_IN_MS } from "@/config/constants";
import { useEffect } from "react";

export const useSyncedClock = (callback: () => void): void => {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      callback();
    }, SECOND_IN_MS - new Date().getMilliseconds());

    setInterval(callback, SECOND_IN_MS);

    return () => clearTimeout(timeoutId);
  }, [callback]);
};
