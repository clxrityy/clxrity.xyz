"use client";
import * as React from "react";
import { cx } from "./classnames";

export type DropdownMenuItem = {
    label: string;
    onSelect?: () => void | Promise<void>;
    href?: string;
    danger?: boolean;
};

export interface DropdownMenuProps {
    open: boolean;
    anchorRef: React.RefObject<HTMLElement>;
    onClose: () => void;
    items: DropdownMenuItem[];
    align?: "start" | "end";
}

export function DropdownMenu({ open, anchorRef, onClose, items, align = "end" }: Readonly<DropdownMenuProps>) {
    const panelRef = React.useRef<HTMLDivElement | null>(null);

    // Close on outside click / focus out
    React.useEffect(() => {
        if (!open) return;
        function handle(ev: MouseEvent) {
            if (!panelRef.current) return;
            if (panelRef.current.contains(ev.target as Node)) return;
            if (anchorRef.current?.contains(ev.target as Node)) return;
            onClose();
        }
        window.addEventListener("mousedown", handle, { capture: true });
        return () => window.removeEventListener("mousedown", handle, { capture: true } as any);
    }, [open, onClose, anchorRef]);

    // Escape key
    React.useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    // Basic focus trapping (first/last)
    React.useEffect(() => {
        if (!open) return;
        const focusables = panelRef.current?.querySelectorAll<HTMLElement>("button,a[href]") || [] as any;
        if (focusables.length) focusables[0].focus();
    }, [open]);

    if (!open) return null;
    return (
        <div ref={panelRef} className={cx("menu", align === 'end' && 'menu-end')} data-open={open} role="menu" aria-orientation="vertical">
            <ul className="menu-list" role="none">
                {items.map((item, i) => {
                    const key = item.label + i;
                    if (item.href) {
                        return (
                            <li key={key} role="none">
                                <a className={cx("menu-item", item.danger && 'danger')} role="menuitem" href={item.href} onClick={() => onClose()}>{item.label}</a>
                            </li>
                        );
                    }
                    return (
                        <li key={key} role="none">
                            <button
                                className={cx("menu-item", item.danger && 'danger')}
                                role="menuitem"
                                type="button"
                                onClick={async () => { try { await item.onSelect?.(); } finally { onClose(); } }}
                            >
                                {item.label}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export default DropdownMenu;
