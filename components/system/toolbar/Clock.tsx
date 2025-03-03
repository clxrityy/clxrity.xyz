"use client";

import { useEffect, useState } from "react";

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

  const formatTime = (time: string) => {
    return time.split(":").slice(0, 2).join(":");
  };

  return (
    <div className="flex items-center justify-center h-full w-full gap-2">
      <span className="text-sm lg:text-base font-mono tracking-tight w-fit z-2">
        {formatTime(time)}
      </span>
    </div>
  );
};
