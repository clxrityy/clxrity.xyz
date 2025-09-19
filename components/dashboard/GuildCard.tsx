"use client";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import styles from "./guild-card.module.css";

export type GuildCardProps = {
    id: string;
    name: string;
    iconUrl?: string | null;
    status?: "connected" | "disconnected" | "partial";
    stats?: { birthdayCount?: number; hasChannel?: boolean; hasRole?: boolean };
};

const statusMap: Record<NonNullable<GuildCardProps["status"]>, { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }> = {
    connected: { label: "Connected", variant: "neutral" },
    disconnected: { label: "Disconnected", variant: "danger" },
    partial: { label: "Partial", variant: "warning" },
};

export default function GuildCard({ id, name, iconUrl, status = "connected", stats }: Readonly<GuildCardProps>) {
    const statusCfg = statusMap[status];
    return (
        <Card clickable header={
            <div className="row">
                <div className={styles.headLeft}>
                    <div className={styles.avatar} aria-hidden>
                        {iconUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={iconUrl} alt="" width={36} height={36} className={styles.avatarImg} />
                        ) : (
                            <div className={styles.avatarPlaceholder} />
                        )}
                    </div>
                    <strong className={styles.name}>{name}</strong>
                </div>
                <Badge size="sm" variant={statusCfg.variant}>{statusCfg.label}</Badge>
            </div>
        } footer={
            <div className="row">
                <span className="small muted">ID: {id}</span>
                <Link href={`/dashboard/${id}`}>
                    <Button size="sm" variant="secondary">Manage</Button>
                </Link>
            </div>
        }>
            <div className="stack">
                <div className="row between">
                    <span className="small muted">Birthdays</span>
                    <strong>{stats?.birthdayCount ?? 0}</strong>
                </div>
                <div className="row" aria-label="Configuration checklist">
                    <Badge size="sm" variant={stats?.hasChannel ? 'success' : 'warning'}>
                        {stats?.hasChannel ? 'Channel set' : 'No channel'}
                    </Badge>
                    <Badge size="sm" variant={stats?.hasRole ? 'success' : 'neutral'}>
                        {stats?.hasRole ? 'Role set' : 'Role optional'}
                    </Badge>
                </div>
            </div>
        </Card>
    );
}
