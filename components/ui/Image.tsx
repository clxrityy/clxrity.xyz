"use client";

import Image, { ImageProps } from "next/image";
import { ComponentPropsWithRef, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/util/cn";

export interface ImageComponentProps extends ComponentPropsWithRef<"image"> {
  className?: string;
  image: Omit<ImageProps, "width" | "height"> & {
    width: number;
    height: number;
  };
  priority?: boolean;
}

export const ImageComponent = (props: ImageComponentProps) => {
  const [loading, setLoading] = useState(true);
  const [elementRef, setElementRef] = useState<HTMLDivElement | null>(null);

  const ref = useRef<HTMLDivElement>(elementRef!);

  return (
    <>
      {loading && <Skeleton ref={ref} />}
      <Image
        className={cn("no-selector", props.className)}
        {...props.image}
        src={props.image.src}
        alt={props.image.alt || "img"}
        onLoad={() => {
          setLoading(false);
          setElementRef(ref.current);
        }}
        priority={props.priority}
      />
    </>
  );
};
