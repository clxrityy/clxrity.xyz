"use client";
import * as React from "react";
import { cx } from "./classnames";

export type AvatarProps = {
    src?: string | null;
    alt?: string;
    size?: number;
    fallback?: string;
    className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const AvatarButton = React.forwardRef<HTMLButtonElement, AvatarProps>(function AvatarButton(
    { src, alt = "User avatar", size = 40, fallback = "?", className, ...rest }, ref
) {
    return (
        <button
            ref={ref}
            type="button"
            className={cx("avatar-btn", className)}
            data-size={size}
            aria-label={alt}
            {...rest}
        >
            {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={src}
                    alt={alt}
                    width={size}
                    height={size}
                    className="avatar-img"
                    loading="lazy"
                    decoding="async"
                />
            ) : (
                <span className="avatar-fallback" aria-hidden>{fallback.slice(0, 2).toUpperCase()}</span>
            )}
        </button>
    );
});

export default AvatarButton;
