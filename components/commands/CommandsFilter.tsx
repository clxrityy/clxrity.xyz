"use client";
import React, { useState, useMemo } from "react";
import CommandCard from "./CommandCard";
import styles from "./commands.module.css";

type Props = { readonly commands: any[] };

export default function CommandsFilter({ commands }: Props) {
    const [query, setQuery] = useState("");
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

    const filtered = useMemo(() => {
        return commands.filter((cmd) => {
            const matchesQuery =
                cmd.name.toLowerCase().includes(query.toLowerCase()) ||
                cmd.description?.toLowerCase().includes(query.toLowerCase());
            return matchesQuery;
        });
    }, [commands, query]);

    return (
        <div>
            <input
                className={styles.commandsSearchBar}
                placeholder="Search commands..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <div className={styles.commandsGrid}>
                {filtered.map((cmd, idx) => (
                    <CommandCard
                        key={cmd.name}
                        command={cmd}
                        expanded={expandedIdx === idx}
                        onExpand={() => setExpandedIdx(idx)}
                        onCollapse={() => setExpandedIdx(null)}
                    />
                ))}
            </div>
            {filtered.length === 0 && <div className="text-muted-foreground text-lg mt-8 text-center">No commands found.</div>}
        </div>
    );
}
