import * as React from "react";
import { IconProps, applyIconSize } from "./IconProps";

export default function IconInvite(props: Readonly<IconProps>) {
    const svgProps = applyIconSize(props, 20);
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...svgProps}
        >
            {/* Envelope base */}
            <rect x="3" y="5" width="18" height="14" rx="2" />
            {/* Flap / inner lines */}
            <path d="M3 8.5 12 13l9-4.5" />
            <path d="M7 18.5l5-3 5 3" />
            {/* Plus (invite action) */}
            <path d="M12 3v4" />
            <path d="M10 5h4" />
        </svg>
    );
}
