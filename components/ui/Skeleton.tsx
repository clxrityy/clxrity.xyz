import { cn } from "@/util/cn";
import { RefObject, useEffect, useState } from "react";

export interface SkeletonProps {
  ref: RefObject<HTMLDivElement>;
}

export function Skeleton({ ref }: SkeletonProps) {
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    if (ref.current) {
      setWidth(ref.current.getBoundingClientRect().width);
      setHeight(ref.current.getBoundingClientRect().height);
    }
  }, [ref]);

  return (
    <div
      ref={ref}
      style={{ width: width, height: height }}
      className={cn("animate-pulse bg-gray-700/75 rounded-lg")}
    />
  );
}
