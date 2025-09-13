import * as React from 'react';
import { IconProps, applyIconSize } from './IconProps';

export default function IconMenu(props: Readonly<IconProps>) {
    const svgProps = applyIconSize(props, 20);
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...svgProps}>
            <path fill="currentColor" d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z" />
        </svg>
    );
}
