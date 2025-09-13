import * as React from 'react';

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
    size?: number | string; // Accept number (px) or any CSS size string
}

export function applyIconSize(props: IconProps, defaultSize: number = 20) {
    const { size, ...rest } = props;
    const resolved = size ?? defaultSize;
    return { width: resolved, height: resolved, ...rest } as const;
}
