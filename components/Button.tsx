'use client';
import Link from 'next/link';
import React, { FC, ReactNode } from 'react';
import styles from '@/styles/Button.module.css';
import { robotoMono } from '@/utils/fonts';


interface Props {
    children: ReactNode;
    link: string;
    shadow: 'purple' | 'blue' | 'white';
}


const Button: FC<Props> = ({ children, link, shadow }) => {

    let shadowClassName = styles.whiteShadow;

    if (shadow === 'purple') {
        shadowClassName = styles.purpleShadow;
    }
    if (shadow === 'blue') {
        shadowClassName = styles.blueShadow;
    }
    if (shadow === 'white') {
        shadowClassName = styles.whiteShadow;
    }

    return <Link href={link} className={`${robotoMono.className} w-full flex items-center justify-center`}>
        <button className={`${shadowClassName} ${styles.button}`}>
            {children}
        </button>
    </Link>
}

export default Button;