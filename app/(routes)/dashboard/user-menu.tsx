"use client";
import * as React from "react";
import AvatarButton from "@/components/ui/Avatar";
import DropdownMenu from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui";

export interface ClientUserMenuProps {
    inviteUrl: string;
    avatarUrl: string | null;
    name: string;
}

export default function ClientUserMenu({ inviteUrl, avatarUrl, name }: Readonly<ClientUserMenuProps>) {
    const anchorRef = React.useRef<HTMLButtonElement | null>(null);
    const [open, setOpen] = React.useState(false);
    const firstInitial = (name || "?").trim()[0] || "?";

    const items = React.useMemo(() => ([
        { label: "Invite Bot", href: inviteUrl },
        { label: "Sign out", onSelect: async () => { const f = document.getElementById('signout-form') as HTMLFormElement | null; f?.requestSubmit(); }, danger: false },
    ]), [inviteUrl]);

    return (
        <div className="user-menu-wrap">
            <form id="signout-form" action={async () => { "use server"; const { signOut } = await import("@/lib/auth"); await signOut(); }} />
            <Button as-child="true" variant="secondary" className="mobile-only" onClick={() => { window.location.href = inviteUrl; }}>Invite</Button>
            <AvatarButton ref={anchorRef} src={avatarUrl || undefined} fallback={firstInitial} onClick={() => setOpen(o => !o)} />
            <DropdownMenu open={open} anchorRef={anchorRef as any} onClose={() => setOpen(false)} items={items} />
        </div>
    );
}
