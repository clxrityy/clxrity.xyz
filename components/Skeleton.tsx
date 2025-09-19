import { HTMLAttributes } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    width?: string;
    height?: string;
    borderRadius?: string;
}

export function Skeleton({ width, height, borderRadius, ...props }: Readonly<SkeletonProps>) {
    return (
        <div
            className="animate-pulse bg-gradient-to-tl from-gray-300/50 to-gray-500/30 skeleton shimmer"
            style={{ width, height, borderRadius }}
            {...props}
        />
    )
}