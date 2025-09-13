import * as React from 'react';
import { IconProps, applyIconSize } from './IconProps';

export default function IconGithub(props: Readonly<IconProps>) {
    const svgProps = applyIconSize(props, 20);
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...svgProps}>
            <path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7C6.73 19.91 6 17.91 6 17.91c-.45-1.13-1.11-1.43-1.11-1.43-.9-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.4-.27-4.93-1.2-4.93-5.33 0-1.18.42-2.15 1.1-2.91-.11-.27-.48-1.36.1-2.83 0 0 .9-.29 2.95 1.11.86-.24 1.78-.36 2.7-.36s1.84.12 2.7.36c2.05-1.4 2.95-1.11 2.95-1.11.58 1.47.21 2.56.1 2.83.69.76 1.1 1.73 1.1 2.91 0 4.14-2.53 5.05-4.95 5.32.36.31.68.92.68 1.86v2.76c0 .26.18.58.69.48A10 10 0 0 0 12 2Z" />
        </svg>
    );
}
