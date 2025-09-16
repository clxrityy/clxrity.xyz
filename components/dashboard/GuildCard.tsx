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
};

const statusMap: Record<NonNullable<GuildCardProps["status"]>, { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }> = {
    connected: { label: "Connected", variant: "neutral" },
    disconnected: { label: "Disconnected", variant: "danger" },
    partial: { label: "Partial", variant: "warning" },
};

export default function GuildCard({ id, name, iconUrl, status = "connected" }: Readonly<GuildCardProps>) {
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
                    <strong>{name}</strong>
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
            {/* body could show counts or description later */}
        </Card>
    );
}
