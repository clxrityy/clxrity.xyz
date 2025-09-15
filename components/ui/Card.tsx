"use client";
import { cx } from "./classnames";

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
    size?: "sm" | "md" | "lg";
    variant?: "solid" | "outline" | "soft";
    clickable?: boolean;
    header?: React.ReactNode;
    footer?: React.ReactNode;
};

const base = "rounded-xl border text-[var(--fg)] bg-[var(--card)] border-[var(--border)]";
const sizeStyles: Record<NonNullable<CardProps["size"]>, string> = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
};
const variantStyles: Record<NonNullable<CardProps["variant"]>, string> = {
    solid: "",
    outline: "bg-transparent",
    soft: "bg-[color-mix(in_oklab,var(--card),transparent_30%)]",
};

export function Card({ size = "md", variant = "solid", clickable, header, footer, className, children, ...rest }: CardProps) {
    return (
        <div
            className={cx(
                base,
                sizeStyles[size],
                variantStyles[variant],
                clickable && "transition hover:bg-[var(--border)] cursor-pointer",
                className
            )}
            {...rest}
        >
            {header ? <div className="card-header mb-3">{header}</div> : null}
            <div className="card-body">{children}</div>
            {footer ? <div className="card-footer mt-4 text-sm text-[var(--muted)]">{footer}</div> : null}
        </div>
    );
}

export default Card;
