"use client";

import { useCallback, useEffect, useState } from "react";
import { ICONS } from "@/styles/misc/icons";
import { useSyncedClock } from "@/hooks/useSyncedClock";

function getHours12(date: Date) {
  const hours = date.getHours();
  return hours > 12 ? hours - 12 : hours;
}

export const Clock = () => {
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const [now, setNow] = useState(new Date());
  const updateClock = useCallback(() => setNow(new Date()), []);
  useSyncedClock(updateClock);

  const { clocks } = ICONS;

  if (!mounted) return null;

  const getClock = (hour: number) => {
    const rounded = Math.round(hour);
    switch (rounded) {
      case 1:
        return clocks[1];
      case 2:
        return clocks[2];
      case 3:
        return clocks[3];
      case 4:
        return clocks[4];
      case 5:
        return clocks[5];
      case 6:
        return clocks[6];
      case 7:
        return clocks[7];
      case 8:
        return clocks[8];
      case 9:
        return clocks[9];
      case 10:
        return clocks[10];
      case 11:
        return clocks[11];
      case 12:
        return clocks[12];
      default:
        return clocks[12];
    }
  };

  const formatTime = (time: Date) => {
    // const [hour] = formatted.split(":").map((n) => parseInt(n));

    // Mon Mar 03 2025 21:46:29 GMT-0500 (Eastern Standard Time)

    const formatted = time
      .toLocaleTimeString("en-US", {
        hour12: true,
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      })
      .split(" ")[0];
    const hour = getHours12(time);
    const Icon = getClock(hour);
    return (
      <div
        aria-label={formatted}
        role="time"
        className={`flex items-center justify-center gap-2 h-full w-full px-4 hover:bg-zinc-600/25 transition-all duration-75 rounded-md`}
      >
        <Icon className="w-5 h-5" />
        <span className="text-sm lg:text-base font-mono tracking-tight w-fit z-2">
          {formatted}
        </span>
      </div>
    );
  };

  return <>{formatTime(now)}</>;
};
