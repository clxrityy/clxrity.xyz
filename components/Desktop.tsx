"use client";

import dynamic from "next/dynamic";

const DynamicAppIcon = dynamic(() => import("./AppIcon").then(mod => mod.AppIcon));
import { desktopApps } from "./desktopApps";

export default function Desktop() {
    return (
        <div className="retro-desktop-bg min-h-screen w-full flex flex-wrap items-start p-8 relative">
            <div className="desktop-icons flex flex-wrap">
                {desktopApps.map((app, idx) => (
                    <button
                        key={app.name}
                        onClick={() => window.open(app.link, "_blank", "noopener,noreferrer")}
                        type="button"
                        rel="noopener noreferrer"
                        className="desktop-icon flex flex-col items-center m-4 select-none"
                        title={(app as any).description ? `${app.name}: ${(app as any).description}` : app.name}
                    >
                        <DynamicAppIcon app={app} />
                    </button>
                ))}
            </div>
        </div>
    );
}
