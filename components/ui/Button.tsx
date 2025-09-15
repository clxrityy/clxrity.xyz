"use client";
import { forwardRef } from "react";
import { cx } from "./classnames";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    size?: "sm" | "md" | "lg";
    variant?: "primary" | "secondary" | "ghost" | "danger";
    block?: boolean;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
    sm: "px-3 py-1.5 text-sm rounded-md",
    md: "px-4 py-2 text-sm rounded-lg",
    lg: "px-5 py-3 text-base rounded-xl",
};

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary: "bg-[var(--accent)] text-white hover:brightness-110",
    secondary: "bg-[var(--card)] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--border)]",
    ghost: "bg-transparent text-[var(--fg)] hover:bg-[var(--card)] border border-transparent",
    danger: "bg-[#ef4444] text-white hover:brightness-110",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { size = "md", variant = "primary", block = false, loading = false, leftIcon, rightIcon, className, children, disabled, ...rest },
    ref
) {
    return (
        <button
            ref={ref}
            className={cx(
                "inline-grid grid-flow-col auto-cols-max items-center justify-center gap-2 font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
                sizeStyles[size],
                variantStyles[variant],
                block && "w-full",
                (disabled || loading) && "opacity-60 cursor-not-allowed",
                className
            )}
            disabled={disabled || loading}
            {...rest}
        >
            {leftIcon ? <span className="icon" aria-hidden>{leftIcon}</span> : null}
            <span className="label">{children}</span>
            {rightIcon ? <span className="icon" aria-hidden>{rightIcon}</span> : null}
        </button>
    );
});

export default Button;
