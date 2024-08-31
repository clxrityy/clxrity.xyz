"use client";
import { useState, useEffect } from "react";

const useScreenSize = () => { 
    const [screenSize, setScreenSize] = useState<{
        width: number;
        height: number;
    }>({
        width: window.innerWidth,
        height: window.innerHeight
    });

    useEffect(() => {
        const handleResize = () => {
            if (typeof window !== "undefined") {
                setScreenSize({
                    width: window.innerWidth,
                    height: window.innerHeight
                });
            }
        };

        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return screenSize;
}

export default useScreenSize;