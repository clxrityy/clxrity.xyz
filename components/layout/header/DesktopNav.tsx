"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  dashboardUrl?: string | null;
  inviteUrl?: string | null;
};

export default function DesktopNav({ dashboardUrl, inviteUrl }: Readonly<Props>) {
  const pathname = usePathname();
  const [hash, setHash] = useState<string>("");
  useEffect(() => {
    // Read hash on mount and update on hashchange for accurate Privacy vs Terms highlighting
    if (typeof window !== "undefined") {
      setHash(window.location.hash || "");
      const onHash = () => setHash(window.location.hash || "");
      window.addEventListener("hashchange", onHash);
      return () => window.removeEventListener("hashchange", onHash);
    }
  }, []);

  const isDashboardActive = (() => {
    if (!dashboardUrl) return false;
    if (!dashboardUrl.startsWith("/")) return false;
    return pathname === dashboardUrl || pathname.startsWith(dashboardUrl + "/");
  })();
  const isCommandsActive = pathname.startsWith("/commands");
  const isPrivacyActive = pathname === "/tos" && hash === "#privacy";
  const isTermsActive = pathname === "/tos" && !isPrivacyActive;
  const renderDashboard = () => {
    if (!dashboardUrl) return null;
    if (dashboardUrl.startsWith('/')) return (
      <Link href={dashboardUrl} aria-current={isDashboardActive ? 'page' : undefined}>Dashboard</Link>
    );
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
      {renderInvite()}
      <Link aria-label="Commands" href="/commands" aria-current={isCommandsActive ? 'page' : undefined}>Commands</Link>
      <Link aria-label="Privacy Policy" href="/tos#privacy" aria-current={isPrivacyActive ? 'page' : undefined}>Privacy</Link>
      <Link aria-label="Terms of Service" href="/tos" aria-current={isTermsActive ? 'page' : undefined}>Terms</Link>
    </nav>
  );
}
