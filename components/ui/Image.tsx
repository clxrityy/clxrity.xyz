"use client";

import Image, { ImageProps } from "next/image";
import { useRef, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export const ImageComponent = (props: {
  image: Omit<ImageProps, "width" | "height"> & {
    width: number;
    height: number;
  };
  className?: string;
}) => {
  const [loading, setLoading] = useState(true);
  const [elementRef, setElementRef] = useState<HTMLDivElement | null>(null);

  const ref = useRef<HTMLDivElement>(elementRef!);

  return (
    <div ref={ref} className="relative w-full flex items-center justify-center">
      {loading && <Skeleton ref={ref} />}
      <Image
        className={props.className}
        {...props.image}
        alt={props.image.alt || ""}
        onLoad={() => {
          setLoading(false);
          setElementRef(ref.current);
        }}
        priority
      />
    </div>
  );
};
