"use client";

import { useRef, useState, useEffect } from "react";
import { AppIcon } from "./AppIcon";
import type { DesktopApp } from "../utils/desktopApps";

export function AppButton({ app }: Readonly<{ app: DesktopApp }>) {
    const [showMenu, setShowMenu] = useState(false);
    const holdTimeout = useRef<NodeJS.Timeout | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    // Close menu on outside click/touch
    useEffect(() => {
        if (!showMenu) return;
        function handle(event: MouseEvent | TouchEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        }
        document.addEventListener("mousedown", handle);
        document.addEventListener("touchstart", handle);
        return () => {
            document.removeEventListener("mousedown", handle);
            document.removeEventListener("touchstart", handle);
        };
    }, [showMenu]);

    // Right click (desktop)
    function handleContextMenu(e: React.MouseEvent) {
        e.preventDefault();
        setShowMenu((v) => !v);
    }

    // Press and hold (mobile)
    function handleTouchStart() {
        holdTimeout.current = setTimeout(() => setShowMenu(true), 500);
    }
    function handleTouchEnd() {
        if (holdTimeout.current) clearTimeout(holdTimeout.current);
    }

    return (
        <div className="relative">
            <button
                type="button"
                rel="noopener noreferrer"
                className="desktop-icon flex flex-col items-center m-4 select-none"
                title={app.description ? `${app.name}: ${app.description}` : app.name}
                onClick={() => window.open(app.link, "_blank", "noopener,noreferrer")}
                onContextMenu={handleContextMenu}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
            >
                <AppIcon app={app} />
            </button>
            {showMenu && (
                <div
                    ref={menuRef}
                    className="app-menu-box absolute left-1/2 -translate-x-1/2 top-full mt-2 min-w-[180px] bg-white bg-opacity-95 border border-gray-300 rounded shadow-lg p-3 z-50 text-xs text-black"
                    role="dialog"
                    tabIndex={0}
                    onClick={() => setShowMenu(false)}
                    onKeyDown={e => {
                        if (e.key === "Escape" || e.key === "Enter" || e.key === " ") setShowMenu(false);
                    }}
                >
                    <div className="font-bold mb-1">{app.name}</div>
                    <div>{app.description || "No description."}</div>
                </div>
            )}
        </div>
    );
}