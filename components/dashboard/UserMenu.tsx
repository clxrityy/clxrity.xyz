"use client";
import * as React from "react";
import AvatarButton from "@/components/ui/Avatar";
import DropdownMenu from "@/components/ui/DropdownMenu";
import { signOutAction } from "./actions";

export interface UserMenuProps {
    inviteUrl: string;
    avatarUrl: string | null;
    name: string;
}

export default function UserMenu({ inviteUrl, avatarUrl, name }: Readonly<UserMenuProps>) {
    const anchorRef = React.useRef<HTMLButtonElement | null>(null);
    const [open, setOpen] = React.useState(false);
    const firstInitial = (name || "?").trim()[0] || "?";

    const items = React.useMemo(() => ([
        { label: "Invite Bot", href: inviteUrl },
        { label: "Sign out", onSelect: async () => { const f = document.getElementById('signout-form') as HTMLFormElement | null; f?.requestSubmit(); } },
    ]), [inviteUrl]);

    return (
        <div className="user-menu-wrap">
            {/* Hidden form referencing server action so dropdown item can submit it */}
            <form id="signout-form" action={signOutAction} />
            <AvatarButton
                ref={anchorRef}
                src={avatarUrl || undefined}
                fallback={firstInitial}
                onClick={() => setOpen(o => !o)}
            />
            <DropdownMenu
                open={open}
                anchorRef={anchorRef as any}
                onClose={() => setOpen(false)}
                items={items}
            />
        </div>
    );
}
