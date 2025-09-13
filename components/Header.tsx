"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import IconMenu from "./icons/IconMenu";
import IconSun from "./icons/IconSun";
import IconMoon from "./icons/IconMoon";
import { useTheme } from "./ThemeProvider";
import { INVITE_URL, DASHBOARD_URL } from "@/lib/config/urls";

export default function Header() {
    const { theme, toggle } = useTheme();
    // open = visual state; mounted keeps menu in DOM for fade-out
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);
    const tracking = useRef(false);
    const edgeWidth = 28; // px from left edge to start open gesture
    const minSwipe = 60; // minimum horizontal travel to act
    const maxAngle = 32; // degrees off pure horizontal allowed
    const panelRef = useRef<HTMLElement | null>(null);
    const renderDashboardLink = (onClick?: () => void) => {
        if (typeof DASHBOARD_URL !== 'string' || !DASHBOARD_URL) return null;
        if (DASHBOARD_URL.startsWith('/')) {
            return <Link href={DASHBOARD_URL} onClick={onClick}>Dashboard</Link>;
        }
        return <a href={DASHBOARD_URL} target="_blank" rel="noreferrer noopener" onClick={onClick}>Dashboard</a>;
    };
    const renderInviteLink = (onClick?: () => void) => {
        if (typeof INVITE_URL !== 'string' || !INVITE_URL) return null;
        return <a href={INVITE_URL} target="_blank" rel="noreferrer noopener" onClick={onClick}>Invite</a>;
    };
    const openMenu = () => {
        if (mounted) {
            setOpen(true);
        } else {
            setMounted(true);
            requestAnimationFrame(() => setOpen(true));
        }
    };
    const closeMenu = () => setOpen(false);
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);
    // Touch gesture: open with rightward swipe from left edge; close with leftward swipe on panel/overlay
    useEffect(() => {
        const onTouchStart = (e: TouchEvent) => {
            if (e.touches.length !== 1) return;
            const t = e.touches[0];
            touchStartX.current = t.clientX;
            touchStartY.current = t.clientY;
            // Only begin tracking open gesture if closed & near edge; if open track close gesture anywhere over panel/wrap
            if (!open) {
                if (t.clientX <= edgeWidth) tracking.current = true; else tracking.current = false;
            } else {
                tracking.current = true;
            }
        };
        const onTouchMove = (e: TouchEvent) => {
            if (!tracking.current || touchStartX.current == null || touchStartY.current == null) return;
            const t = e.touches[0];
            const dx = t.clientX - touchStartX.current;
            const dy = t.clientY - touchStartY.current;
            // abort if mostly vertical
            const angle = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);
            if (angle > maxAngle) return; // let vertical scroll proceed
            // Prevent horizontal scroll interference
            if (Math.abs(dx) > 8) e.preventDefault();
        };
        const onTouchEnd = (e: TouchEvent) => {
            if (!tracking.current || touchStartX.current == null) { tracking.current = false; return; }
            const changed = e.changedTouches[0];
            const dx = changed.clientX - touchStartX.current;
            // Decide action
            if (!open && dx > minSwipe) {
                setOpen(true);
            } else if (open && dx < -minSwipe) {
                setOpen(false);
            }
            tracking.current = false;
            touchStartX.current = null;
            touchStartY.current = null;
        };
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onTouchEnd, { passive: true });
        return () => {
            window.removeEventListener('touchstart', onTouchStart as any);
            window.removeEventListener('touchmove', onTouchMove as any);
            window.removeEventListener('touchend', onTouchEnd as any);
        };
    }, [open]);
    useEffect(() => {
        const prev = document.body.style.overflow;
        if (open) document.body.style.overflow = 'hidden'; else document.body.style.overflow = prev || '';
        return () => { document.body.style.overflow = prev || ''; };
    }, [open]);
    // Unmount after fade-out
    useEffect(() => {
        if (open || !mounted) return;
        const overlay = document.querySelector('.mm-root .mm-overlay');
        if (!overlay) { setMounted(false); return; }
        const onEnd = (e: Event) => {
            if (e.target !== overlay) return;
            if (!open) setMounted(false);
        };
        overlay.addEventListener('transitionend', onEnd as EventListener);
        return () => overlay.removeEventListener('transitionend', onEnd as EventListener);
    }, [open, mounted]);
    // Debug: log when menu opens and how many nav links are rendered
    useEffect(() => {
        if (open) {
            requestAnimationFrame(() => {
                const nav = document.querySelector('.mobile-sheet .stack');
                if (nav) {
                    // @ts-ignore
                    console.debug('[mobile-menu] link count:', nav.querySelectorAll('a').length);
                } else {
                    console.debug('[mobile-menu] nav .stack not found');
                }
            });
        }
    }, [open]);
    useEffect(() => {
        if (!open) return;
        const handlePointerDown = (e: PointerEvent) => {
            if (!panelRef.current) return;
            if (!panelRef.current.contains(e.target as Node)) {
                closeMenu();
            }
        };
        window.addEventListener('pointerdown', handlePointerDown, { capture: true });
        return () => window.removeEventListener('pointerdown', handlePointerDown, { capture: true } as any);
    }, [open]);
    return (
        <header className="site-header">
            <div className="container row">
                <button type="button" className="icon-btn mobile-only" aria-label="Open menu" onClick={openMenu}>
                    <IconMenu />
                </button>
                <Link href="/" className="brand">hbd</Link>
                <nav className="nav desktop-only" aria-label="Primary">
                    {renderDashboardLink()}
                    <Link href="/commands">Commands</Link>
                    <Link href="/privacy">Privacy</Link>
                    <Link href="/terms">Terms</Link>
                    {renderInviteLink()}
                </nav>
                <button type="button" className="icon-btn" aria-label="Toggle theme" onClick={toggle}>
                    {theme === 'light' ? <IconMoon /> : <IconSun />}
                </button>
            </div>
            {mounted && (
                <div className="mm-root mobile-only" data-open={open}>
                    <div
                        className="mm-overlay"
                        role="button"
                        tabIndex={0}
                        aria-label="Close menu"
                        onClick={closeMenu}
                        onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') closeMenu(); }}
                    />
                    <div className="mm-wrap" role="presentation">
                        <aside
                            className="mm-panel"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Mobile Menu"
                            tabIndex={-1}
                            ref={panelRef}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => { if (e.key === 'Escape') closeMenu(); }}
                        >
                            <div className="mm-close-row">
                                <button type="button" className="mm-close-btn" onClick={closeMenu} aria-label="Close menu">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                        <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>
                            <nav aria-label="Mobile Primary">
                                <ul className="mm-links">
                                    {renderDashboardLink(closeMenu) && (
                                        <li>{renderDashboardLink(closeMenu)}</li>
                                    )}
                                    <li><Link href="/commands" onClick={closeMenu}>Commands</Link></li>
                                    <li><Link href="/privacy" onClick={closeMenu}>Privacy</Link></li>
                                    <li><Link href="/terms" onClick={closeMenu}>Terms</Link></li>
                                    {renderInviteLink(closeMenu) && (
                                        <li>{renderInviteLink(closeMenu)}</li>
                                    )}
                                </ul>
                            </nav>
                            <div className="mm-footer">
                                <span>&copy; {new Date().getFullYear()} hbd</span>
                                <span>All rights reserved.</span>
                            </div>
                        </aside>
                    </div>
                </div>
            )}
        </header>
    );
}
