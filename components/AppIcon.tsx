import Image from "next/image";
import type { DesktopApp } from "./desktopApps";

export function AppIcon({ app }: Readonly<{ app: DesktopApp }>) {
    let badge = null;
    if (app.online) {
        badge = <span className="status-badge online" title="Online" />;
    } else {
        badge = <span className="status-badge offline" title="Offline" />;
    }

    return (
        <div className="icon-wrapper relative flex flex-col items-center">
            <div className="relative">
                <Image src={app.icon} alt={app.name} width={64} height={64} />
                {badge}
            </div>
            <span className="icon-label mt-2 text-xs bg-opacity-60 px-2 py-1 rounded w-full bg-gradient-to-b from-white/85 to-white/25 text-black">
                {app.name}
            </span>
        </div>
    );
}
