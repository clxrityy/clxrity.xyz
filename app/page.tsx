"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { INVITE_URL, DASHBOARD_URL } from "@/lib/config/urls";
import Image from "next/image";
import { IconDashboard, IconInvite } from "@/components/icons";

type Status = { online: boolean; guilds: number; startedAt?: number; uptimeMs?: number };


export default function HomePage() {
    const [status, setStatus] = useState<Status | null>(null);
    useEffect(() => {
        let cancelled = false;
        let failures = 0;
        let es: EventSource | null = null;
        let pollId: ReturnType<typeof setInterval> | null = null;

        const setStatusSafe = (d: Status) => { if (!cancelled) setStatus(d); };

        async function pollOnce() {
            try {
                const r = await fetch('/api/status');
                const d: Status = await r.json();
                setStatusSafe(d);
            } catch { /* ignore */ }
        }

        function startFallbackPoll() {
            if (pollId) return; // already polling
            pollOnce();
            pollId = setInterval(() => {
                if (document.visibilityState === 'visible') void pollOnce();
            }, 30000);
        }

        function handleStatusEvent(ev: Event) {
            if (cancelled) return;
            try {
                const me = ev as MessageEvent;
                const data = JSON.parse(me.data);
                setStatusSafe(data);
                failures = 0;
            } catch { /* parse error ignore */ }
        }

        function scheduleReconnect() {
            failures++;
            if (failures >= 5) {
                startFallbackPoll();
                return;
            }
            const timeout = Math.min(30000, 1000 * 2 ** failures);
            setTimeout(() => { if (!cancelled) startEventSource(); }, timeout);
        }

        function startEventSource() {
            es?.close();
            try {
                es = new EventSource('/api/status/stream');
            } catch {
                startFallbackPoll();
                return;
            }
            es.addEventListener('status', handleStatusEvent);
            es.onerror = () => {
                es?.close();
                scheduleReconnect();
            };
        }

        startEventSource();
        return () => {
            cancelled = true;
            es?.close();
            if (pollId) clearInterval(pollId);
        };
    }, []);

    return (
        <main className="main-layout">
            <section className="hero container">
                <div className="row gap-24">
                    <div className="stack-lg">
                        <h1>hbd — Celebrate birthdays on Discord</h1>
                        <p>Automated birthday roles, announcements, and more.</p>
                        <div className="row kpis gap-24">
                            <a className="btn" href={INVITE_URL} target="_blank" rel="noreferrer noopener"><IconInvite /> Invite</a>
                            {DASHBOARD_URL.startsWith("/") ? (
                                <Link className="btn secondary" href={DASHBOARD_URL}><IconDashboard /> Dashboard</Link>
                            ) : (
                                <a className="btn secondary" href={DASHBOARD_URL} target="_blank" rel="noreferrer noopener"><IconDashboard /> Dashboard</a>
                            )}
                        </div>
                    </div>
                    <div className="container">
                        <Image src="/android-chrome-512x512.png" alt="hbd logo" width={128} height={128} />
                    </div>
                </div>
            </section>

            <section className="container kpis kpis-centered">
                <div className="card">
                    <div className="small muted">Status</div>
                    <div className="bold">{status?.online ? 'Online' : 'Offline'}</div>
                </div>
                <div className="card">
                    <div className="small muted">Guilds</div>
                    <div className="bold">{status?.guilds ?? '—'}</div>
                </div>
            </section>
        </main>
    );
}
