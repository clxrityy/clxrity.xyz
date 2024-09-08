"use client";
import { useState, useEffect } from "react";

const useScreenSize = () => { 
    const [screenSize, setScreenSize] = useState < {
        width: number | undefined;
        height: number | undefined;
    }>({
        width: window ? window.innerWidth : undefined,
        height: window ? window.innerHeight : undefined
    });

    useEffect(() => {
        const handleResize = () => {
            if (typeof window !== "undefined") {
                setScreenSize({
                    width: window.innerWidth,
                    height: window.innerHeight
                });
            } else {
                setScreenSize({
                    width: undefined,
                    height: undefined
                });
            }
        };

        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return screenSize;
}

export default useScreenSize;