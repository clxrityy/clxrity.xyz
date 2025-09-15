"use client";
import { cx } from "./classnames";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
    rounded?: "sm" | "md" | "lg" | "full";
};

const roundedMap = {
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-xl",
    full: "rounded-full",
} as const;

export function Skeleton({ className, rounded = "md", ...rest }: SkeletonProps) {
    return (
        <div
            className={cx(
                "animate-pulse bg-[color-mix(in_oklab,var(--border),transparent_30%)]",
                roundedMap[rounded],
                className
            )}
            {...rest}
        />
    );
}

export default Skeleton;
