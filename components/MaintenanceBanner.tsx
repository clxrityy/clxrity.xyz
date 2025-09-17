"use client";
import * as React from "react";

/**
 * MaintenanceBanner
 * Displays a dismissible banner when the site/bot is in maintenance mode.
 * Controlled via env flags injected at build time:
 *  - NEXT_PUBLIC_MAINTENANCE_MODE = "true" | "1" (anything truthy enables)
 *  - NEXT_PUBLIC_MAINTENANCE_MESSAGE = custom message text
 *  - NEXT_PUBLIC_MAINTENANCE_VERSION = optional version to force re-show after a deploy
 */
const MAINT_ENABLED = process.env.NEXT_PUBLIC_MAINTENANCE_MODE && /^(1|true|yes|on)$/i.test(process.env.NEXT_PUBLIC_MAINTENANCE_MODE);
const MESSAGE = process.env.NEXT_PUBLIC_MAINTENANCE_MESSAGE || "The bot is currently in maintenance mode. Some features may be unavailable.";
const VERSION = process.env.NEXT_PUBLIC_MAINTENANCE_VERSION || MESSAGE.length.toString();
const STORAGE_KEY = `hbd-maint-dismiss-${VERSION}`;

export default function MaintenanceBanner() {
    const [visible, setVisible] = React.useState(false);

    React.useEffect(() => {
        if (!MAINT_ENABLED) return;
        try {
            const dismissed = localStorage.getItem(STORAGE_KEY);
            if (!dismissed) setVisible(true);
        } catch {
            setVisible(true);
        }
    }, []);

    if (!MAINT_ENABLED || !visible) return null;

    return (
        <div className="maintenance-banner" role="status" aria-live="polite">
            <div className="mb-inner">
                <span className="mb-text">{MESSAGE}</span>
                <button
                    type="button"
                    className="mb-close"
                    aria-label="Dismiss maintenance notice"
                    onClick={() => {
                        try { localStorage.setItem(STORAGE_KEY, "1"); } catch { }
                        setVisible(false);
                    }}
                >
                    ×
                </button>
            </div>
        </div>
    );
}
