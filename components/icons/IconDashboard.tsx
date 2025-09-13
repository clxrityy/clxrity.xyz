import * as React from "react";
import { IconProps, applyIconSize } from "./IconProps";

export default function IconDashboard(props: Readonly<IconProps>) {
    const svgProps = applyIconSize(props, 20);
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...svgProps}>
            <rect x="3" y="3" width="8" height="8" rx="2" />
            <rect x="13" y="3" width="8" height="5" rx="2" />
            <rect x="13" y="10" width="8" height="11" rx="2" />
            <rect x="3" y="13" width="8" height="8" rx="2" />
        </svg>
    );
}
