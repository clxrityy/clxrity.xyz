"use client";
import Link from "next/link";
import { useState, useRef } from "react";
import { IconMenu } from "../../icons";
import DesktopNav from "./DesktopNav";
import ThemeToggle from "./ThemeToggle";
import MobileMenu from "./MobileMenu";
import { INVITE_URL, DASHBOARD_URL } from "@/lib/config/urls";

export default function Header() {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const panelRef = useRef<HTMLElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);

    const openMenu = () => {
        if (mounted) setOpen(true);
        else { setMounted(true); requestAnimationFrame(() => setOpen(true)); }
    };

    return (
        <header className="site-header">
            <div className="container row">
                <button ref={triggerRef} type="button" className="icon-btn mobile-only" aria-label="Open menu" onClick={openMenu}>
                    <IconMenu />
                </button>
                <Link href="/" className="brand">hbd</Link>
                <DesktopNav dashboardUrl={typeof DASHBOARD_URL === 'string' ? DASHBOARD_URL : null} inviteUrl={typeof INVITE_URL === 'string' ? INVITE_URL : null} />
                <ThemeToggle />
            </div>
            <MobileMenu
                open={open}
                setOpen={setOpen}
                mounted={mounted}
                setMounted={setMounted}
                panelRef={panelRef}
                dashboardUrl={typeof DASHBOARD_URL === 'string' ? DASHBOARD_URL : null}
                inviteUrl={typeof INVITE_URL === 'string' ? INVITE_URL : null}
            />
        </header>
    );
}
