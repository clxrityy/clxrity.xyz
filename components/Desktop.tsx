import { desktopApps } from "../utils/desktopApps";
import { Suspense } from "react";
import { Skeleton } from "./Skeleton";
import { AppButton } from "./AppButton";

export function Desktop() {
    return (
        <div className="retro-desktop-bg min-h-screen w-full flex flex-wrap items-start p-8 relative">
            <div className="desktop-icons flex flex-wrap">
                {desktopApps.map((app, idx) => (
                    <Suspense key={`suspense-${app.name}-${idx}`} fallback={<Skeleton width="64px" height="80px" borderRadius="8px" className="m-4" />}>
                        <AppButton app={app} />
                    </Suspense>
                ))}
            </div>
        </div>
    );
}
