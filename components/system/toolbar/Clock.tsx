"use client";

import { useEffect, useState } from "react";
import { ICONS } from "@/styles/misc/icons";

export const Clock = () => {
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(date.toLocaleTimeString());
  const [timeInterval, setTimeInterval] = useState<NodeJS.Timeout>();

  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    setTimeInterval(
      setInterval(() => {
        setDate(new Date());
        setTime(date.toLocaleTimeString());
      }, 1000),
    );

    return () => {
      if (timeInterval) {
        clearInterval(timeInterval);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) {
    return null;
  }

  const { clocks } = ICONS;

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

  const formatTime = (time: string) => {
    const formatted = time.split(":").slice(0, 2).join(":");

    const [hour] = formatted.split(":").map((n) => parseInt(n));

    const Icon = getClock(hour);

    return (
      <div className="flex items-center justify-center gap-2 h-full w-full">
        <Icon className="w-5 h-5" />
        <span className="text-sm lg:text-base font-mono tracking-tight w-fit z-2">
          {formatted}
        </span>
      </div>
    );
  };

  return <>{formatTime(time)}</>;
};
