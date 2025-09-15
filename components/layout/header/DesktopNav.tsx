"use client";
import Link from "next/link";

type Props = {
  dashboardUrl?: string | null;
  inviteUrl?: string | null;
};

export default function DesktopNav({ dashboardUrl, inviteUrl }: Readonly<Props>) {
  const renderDashboard = () => {
    if (!dashboardUrl) return null;
    if (dashboardUrl.startsWith('/')) return <Link href={dashboardUrl}>Dashboard</Link>;
    return (
      <a href={dashboardUrl} target="_blank" rel="noreferrer noopener">Dashboard</a>
    );
  };
  const renderInvite = () => {
    if (!inviteUrl) return null;
    return (
      <a href={inviteUrl} target="_blank" rel="noreferrer noopener">Invite</a>
    );
  };
  return (
    <nav className="nav desktop-only" aria-label="Primary">
      {renderDashboard()}
      <Link href="/commands">Commands</Link>
      <Link href="/tos#privacy">Privacy</Link>
      <Link href="/tos">Terms</Link>
      {renderInvite()}
    </nav>
  );
}
