"use client";
import Link from "next/link";
import { useEffect, useRef, type RefObject } from "react";
import "./mobile.css";

type Category = {
  title: string;
  links: Array<{ label: string; href: string; external?: boolean }>;
};

type Props = {
  open: boolean;
  setOpen(open: boolean): void;
  mounted: boolean;
  setMounted(mounted: boolean): void;
  panelRef: RefObject<HTMLElement | null>;
  dashboardUrl?: string | null;
  inviteUrl?: string | null;
};

export default function MobileMenu({ open, setOpen, mounted, setMounted, panelRef, dashboardUrl, inviteUrl }: Readonly<Props>) {
  // Restore focus to trigger after closing
  const lastFocusedBeforeOpen = useRef<HTMLElement | null>(null);

  const closeMenu = () => setOpen(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const lastMoveX = useRef(0);
  const lastMoveTime = useRef(0);
  const tracking = useRef(false);
  const minSwipe = 60;
  const maxAngle = 32; // degrees off pure horizontal allowed

  useEffect(() => {
    if (open) {
      lastFocusedBeforeOpen.current = document.activeElement as HTMLElement | null;
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev || ''; };
    }
  }, [open]);

  // Basic overlay and focus restore on transition end
  useEffect(() => {
    if (open || !mounted) return;
    const overlay = document.querySelector('.mm-root .mm-overlay');
    if (!overlay) { setMounted(false); return; }
    const onEnd = (e: Event) => {
      if (e.target !== overlay) return;
      if (!open) setMounted(false);
      if (!open && lastFocusedBeforeOpen.current) {
        requestAnimationFrame(() => {
          try { lastFocusedBeforeOpen.current?.focus(); } catch { }
        });
      }
    };
    overlay.addEventListener('transitionend', onEnd as EventListener);
    return () => overlay.removeEventListener('transitionend', onEnd as EventListener);
  }, [open, mounted, setMounted]);

  // Click outside to close (safety in case overlay isn't hit)
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const panel = panelRef.current;
      if (!panel) return;
      if (!panel.contains(e.target as Node)) closeMenu();
    };
    window.addEventListener('pointerdown', onPointerDown, { capture: true });
    return () => window.removeEventListener('pointerdown', onPointerDown, { capture: true } as any);
  }, [open, panelRef]);

  // Swipe left to close with simple drag visuals
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const revertPanel = () => {
      if (panel) {
        panel.style.transition = '';
        panel.style.removeProperty('opacity');
        panel.style.removeProperty('transform');
      }
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      touchStartX.current = t.clientX;
      touchStartY.current = t.clientY;
      lastMoveTime.current = performance.now();
      lastMoveX.current = t.clientX;
      // Only track drags that start within the panel to avoid blocking page scrolls elsewhere
      const panelEl = panelRef.current;
      tracking.current = !!panelEl && panelEl.contains(e.target as Node);
      if (tracking.current && panelEl) {
        panelEl.style.transition = 'none';
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!tracking.current || touchStartX.current == null || touchStartY.current == null) return;
      const t = e.touches[0];
      const dx = t.clientX - touchStartX.current;
      const dy = t.clientY - touchStartY.current;
      const angle = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);
      if (angle > maxAngle) return;
      if (Math.abs(dx) > 8) e.preventDefault();
      const panelEl = panelRef.current;
      if (panelEl) {
        // Closing gesture: dx negative (drag left). Move panel slightly left with opacity fade.
        const progClose = Math.min(Math.max(-dx / 260, 0), 1);
        const translate = -12 - (28 * progClose);
        panelEl.style.transform = `translateX(${translate}px)`;
        panelEl.style.opacity = String(1 - 0.6 * progClose);
      }
      lastMoveTime.current = performance.now();
      lastMoveX.current = t.clientX;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking.current || touchStartX.current == null) { tracking.current = false; return; }
      const changed = e.changedTouches[0];
      const dx = changed.clientX - touchStartX.current;
      const dt = performance.now() - lastMoveTime.current;
      const vx = dt > 0 ? (changed.clientX - lastMoveX.current) / dt : 0; // px per ms
      const fastSwipe = vx < -0.5; // leftwards fast
      const shouldClose = dx < -minSwipe || fastSwipe;
      if (shouldClose) closeMenu(); else revertPanel();
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
      revertPanel();
    };
  }, [open, panelRef]);

  // Categories
  const categories: Category[] = [
    {
      title: 'General',
      links: [
        ...(dashboardUrl ? [{ label: 'Dashboard', href: dashboardUrl, external: !dashboardUrl.startsWith('/') }] : []),
        { label: 'Commands', href: '/commands' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy', href: '/tos#privacy' },
        { label: 'Terms', href: '/tos' },
      ],
    },
    {
      title: 'Bot',
      links: [
        ...(inviteUrl ? [{ label: 'Invite', href: inviteUrl, external: true }] : []),
      ],
    },
  ];

  const renderLink = (l: Category['links'][number]) => {
    if (l.external) {
      return (
        <a href={l.href} target="_blank" rel="noreferrer noopener" onClick={closeMenu}>
          {l.label}
        </a>
      );
    }
    return (
      <Link href={l.href} onClick={closeMenu}>{l.label}</Link>
    );
  };

  return (
    mounted && (
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
            ref={panelRef as any}
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
            <nav aria-label="Mobile Primary" className="mm-categories">
              {categories.map(cat => (
                <section key={cat.title} className="mm-category">
                  <h3 className="mm-category-title">{cat.title}</h3>
                  <ul className="mm-links">
                    {cat.links.map(link => (
                      <li key={`${cat.title}:${link.label}`}>{renderLink(link)}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </nav>
            <div className="mm-footer">
              <span>&copy; {new Date().getFullYear()} hbd</span>
              <span>All rights reserved.</span>
            </div>
          </aside>
        </div>
      </div>
    )
  );
}
