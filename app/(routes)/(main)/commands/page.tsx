import fs from 'fs';
import path from 'path';
import CommandsFilter from '@/components/commands/CommandsFilter';
import "./commands.css";
import styles from '@/components/commands/commands.module.css';

export const revalidate = 0;

export default async function Page() {
    // Read the manifest from lib/commands/manifest.json
    const manifestPath = path.join(process.cwd(), 'lib', 'commands', 'manifest.json');
    let manifest: any[] = [];
    try {
        const raw = await fs.promises.readFile(manifestPath, 'utf-8');
        manifest = JSON.parse(raw);
    } catch (e) {
        console.error('Failed to read commands manifest', e);
    }

    return (
        <div className={styles.commandsContainer}>
            <div className={styles.commandsInner}>
                <h1 className={styles.commandsTitle}>hbd commands</h1>
                <CommandsFilter commands={manifest} />
            </div>
        </div>
    );
}
