import * as React from 'react';
import { IconProps, applyIconSize } from './IconProps';

export default function IconMoon(props: Readonly<IconProps>) {
    const svgProps = applyIconSize(props, 20);
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...svgProps}>
            <path fill="currentColor" d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79Z" />
        </svg>
    );
}
