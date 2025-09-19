"use client"
import React, { useEffect, useRef } from "react";
import styles from "./commands.module.css";

type Props = {
    readonly command: any;
    expanded: boolean;
    onExpand: () => void;
    onCollapse: () => void;
};

const optionTypeMap: Record<number, string> = {
    1: 'Subcommand',
    2: 'Subcommand Group',
    3: 'String',
    4: 'Integer',
    5: 'Boolean',
    6: 'User',
    7: 'Channel',
    8: 'Role',
    9: 'Mentionable',
    10: 'Number',
    11: 'Attachment',
};

export default function CommandCard({ command, expanded, onExpand, onCollapse }: Readonly<Props>) {
    const cardRef = useRef<HTMLDivElement>(null);
    const hasOptions = command.options && command.options.length > 0;

    // Collapse on outside click
    useEffect(() => {
        if (!expanded) return;
        function handleClick(e: MouseEvent) {
            if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
                onCollapse();
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [expanded, onCollapse]);

    return (
        <div
            ref={cardRef}
            className={
                styles.commandCard + (expanded && hasOptions ? ' ' + styles.showOptions : '')
            }
            tabIndex={0}
            role="button"
            onClick={() => (expanded ? onCollapse() : onExpand())}
            onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    expanded ? onCollapse() : onExpand();
                }
                if (e.key === "Escape" && expanded) {
                    onCollapse();
                }
            }}
            onFocus={onExpand}
            onBlur={e => {
                // Only collapse if focus moves outside the card
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    onCollapse();
                }
            }}
        >
            <div className={styles.commandCardHeader}>
                <h3 className={styles.commandCardTitle}>/{command.name}</h3>
                <span className={styles.commandCardType}>{command.type}</span>
                {command.dm_permission === false && <span className={styles.commandCardNoDM}>No DMs</span>}
            </div>
            <p className={styles.commandCardDesc}>{command.description}</p>
            {hasOptions && (
                <div className={styles.commandCardOptions}>
                    <div className={styles.commandCardOptionsTitle}>Options</div>
                    <ul className={styles.commandCardOptionsList}>
                        {command.options.map((option: any) => (
                            <li className={styles.commandOptionItem} key={option.name}>
                                <div className={styles.commandOptionHeader}>
                                    <span>{option.name}</span>
                                    <span className={styles.commandOptionType}>{optionTypeMap[option.type] || option.type}</span>
                                    {option.required && <span className={styles.commandOptionRequired}>Required</span>}
                                </div>
                                {option.description && (
                                    <span className={styles.commandOptionDesc}>{option.description}</span>
                                )}
                                {option.choices && option.choices.length > 0 && (
                                    <div className={styles.commandOptionChoices}>
                                        {option.choices.map((c: any) => (
                                            <span className={styles.commandOptionChoice} key={c.value}>{c.name}</span>
                                        ))}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
