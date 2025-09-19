import { desktopApps } from "../utils/desktopApps";
import "../styles/retro-desktop.css";

export const dynamic = 'force-static';

export default function Loading() {
    // Show 4 loading app skeletons
    return (
        <div className="retro-desktop-bg min-h-screen w-full flex flex-wrap items-start p-8 relative">
            <div className="desktop-icons flex flex-wrap">
                {desktopApps.map((_, idx) => {

                    const appIdx = idx % desktopApps.length;

                    return (
                        <div
                            key={`skeleton-${appIdx}`}
                            className="desktop-icon flex flex-col items-center m-4 select-none animate-pulse"
                            aria-hidden="true"
                        >
                            <div className="relative">
                                <div className="skeleton-icon shimmer mb-2" />
                            </div>
                            <span className="icon-label skeleton-label shimmer mt-2 text-xs bg-opacity-60 px-2 py-1 rounded w-full bg-gradient-to-b from-white/85 to-white/25 text-black" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
