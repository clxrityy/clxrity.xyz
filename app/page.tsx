"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import IconCake from "../components/icons/IconCake";
import { INVITE_URL, DASHBOARD_URL } from "@/lib/config/urls";

type Status = { online: boolean; uptimeMs: number; guilds: number };

function millisToUptime(ms: number) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
}

export default function HomePage() {
    const [status, setStatus] = useState<Status | null>(null);
    useEffect(() => {
        let mounted = true;
        const fetchStatus = () => fetch("/api/status").then(r => r.json()).then((d: Status) => mounted && setStatus(d)).catch(() => { });
        const id = setInterval(() => {
            fetchStatus();
        }, 10000);
        return () => { mounted = false; clearInterval(id); };
    }, []);

    return (
        <main>
            <section className="hero container">
                <div className="row gap-24">
                    <div className="stack-lg">
                        <h1>hbd — Celebrate birthdays on Discord</h1>
                        <p>Automated birthday roles, announcements, and more.</p>
                        <div className="row gap-24">
                            <a className="btn" href={INVITE_URL} target="_blank" rel="noreferrer noopener">Invite the bot</a>
                            {DASHBOARD_URL.startsWith("/") ? (
                                <Link className="btn secondary" href={DASHBOARD_URL}>Open dashboard</Link>
                            ) : (
                                <a className="btn secondary" href={DASHBOARD_URL} target="_blank" rel="noreferrer noopener">Open dashboard</a>
                            )}
                        </div>
                    </div>
                    <div className="card grid-center">
                        <div className="cake">
                            <IconCake />
                            <div className="flame" />
                        </div>
                    </div>
                </div>
            </section>

            <section className="container kpis">
                <div className="card">
                    <div className="small muted">Status</div>
                    <div className="bold">{status?.online ? 'Online' : 'Offline'}</div>
                </div>
                <div className="card">
                    <div className="small muted">Uptime</div>
                    <div className="bold">{status ? millisToUptime(status.uptimeMs) : '—'}</div>
                </div>
                <div className="card">
                    <div className="small muted">Guilds</div>
                    <div className="bold">{status?.guilds ?? '—'}</div>
                </div>
            </section>
        </main>
    );
}
