"use client";
import Button from "./Button";
import styles from "./empty-state.module.css";

export type EmptyStateProps = {
    title: string;
    description?: string;
    actionText?: string;
    onAction?: () => void;
};

export default function EmptyState({ title, description, actionText, onAction }: Readonly<EmptyStateProps>) {
    return (
        <div className={styles.wrap}>
            <div className={styles.inner}>
                <h3 className={styles.title}>{title}</h3>
                {description ? <p className={styles.desc}>{description}</p> : null}
                {actionText ? (
                    <div className={styles.cta}>
                        <Button variant="secondary" onClick={onAction}>{actionText}</Button>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
