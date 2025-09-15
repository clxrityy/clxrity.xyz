"use client";
import { cx } from "./classnames";

export type GridProps = React.HTMLAttributes<HTMLDivElement> & {
    cols?: 1 | 2 | 3 | 4;
    gap?: "sm" | "md" | "lg";
};

const colClass: Record<NonNullable<GridProps["cols"]>, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
};
const gapClass: Record<NonNullable<GridProps["gap"]>, string> = {
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6",
};

export function Grid({ cols = 3, gap = "md", className, children, ...rest }: GridProps) {
    return (
        <div className={cx("grid", colClass[cols], gapClass[gap], className)} {...rest}>
            {children}
        </div>
    );
}

export default Grid;
