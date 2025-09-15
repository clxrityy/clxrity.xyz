"use client";
import { cx } from "./classnames";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
    variant?: "neutral" | "success" | "warning" | "danger" | "accent";
    size?: "sm" | "md";
};

const variantStyles: Record<NonNullable<BadgeProps["variant"]>, string> = {
    neutral: "bg-[var(--card)] text-[var(--fg)] border border-[var(--border)]",
    success: "bg-[color-mix(in_oklab,#10b981,transparent_20%)] text-white",
    warning: "bg-[color-mix(in_oklab,#f59e0b,transparent_15%)] text-white",
    danger: "bg-[color-mix(in_oklab,#ef4444,transparent_15%)] text-white",
    accent: "bg-[var(--accent)] text-white",
};
const sizeStyles: Record<NonNullable<BadgeProps["size"]>, string> = {
    sm: "text-2xs px-2 py-0.5 rounded-md",
    md: "text-xs px-2.5 py-1 rounded-lg",
};

export function Badge({ variant = "neutral", size = "md", className, children, ...rest }: BadgeProps) {
    return (
        <span className={cx("inline-flex items-center font-semibold", variantStyles[variant], sizeStyles[size], className)} {...rest}>
            {children}
        </span>
    );
}

export default Badge;
