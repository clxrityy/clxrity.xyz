import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const root = fileURLToPath(new URL('..', import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), 'clxrity-img-package-'));

try {
    await exec('pnpm', ['pack', '--pack-destination', temporary], { cwd: root });
    const archiveName = (await readdir(temporary)).find((file) => file.endsWith('.tgz'));
    assert(archiveName, 'pnpm pack must produce a tarball');
    const archive = join(temporary, archiveName);
    const { stdout } = await exec('tar', ['-tzf', archive]);
    const files = stdout.trim().split('\n');
    assert(files.includes('package/dist/cli.js'), 'Package must contain the compiled executable');
    assert(files.includes('package/package.json'), 'Package must contain its manifest');
    assert(files.every((file) => file === 'package/' || file === 'package/package.json' || file === 'package/README.md' || file.startsWith('package/dist/')), 'Package must not include secrets, source fixtures, local config, or dependencies');
    console.log(`Package verified: ${files.length} safe entries; no .env or private configuration.`);

    if (process.argv.includes('--install')) {
        const bin = join(temporary, 'bin');
        const elsewhere = join(temporary, 'unrelated-directory');
        await Promise.all([bin, elsewhere].map((path) => mkdir(path)));
        const env = {
            ...process.env,
            PNPM_HOME: bin,
            XDG_CONFIG_HOME: join(temporary, 'user-config'),
            PATH: `${bin}${delimiter}${process.env.PATH ?? ''}`,
        };
        for (const key of Object.keys(env)) {
            if (/^(R2_|AWS_|NODE_OPTIONS$|PUBLIC_BASE_URL$)/.test(key)) delete env[key];
        }
        // This exercises a real global bin install, isolated from the user's
        // actual global packages and shell configuration. No bucket is contacted.
        await exec('pnpm', [
            'add', '--global', '--global-dir', join(temporary, 'global'),
            '--global-bin-dir', bin, '--ignore-scripts', archive,
        ], { cwd: elsewhere, env, timeout: 120_000, maxBuffer: 2 * 1024 * 1024 });
        const result = await exec(join(bin, 'clxrity-img'), ['--help'], { cwd: elsewhere, env });
        assert.match(result.stdout, /Usage: clxrity-img/);
        assert.equal(result.stderr, '');
        const version = await exec(join(bin, 'clxrity-img'), ['--version'], { cwd: elsewhere, env });
        assert.match(version.stdout, /^\d+\.\d+\.\d+\n$/);
        console.log('Isolated global install verified from an unrelated directory (including Sharp runtime dependencies).');
    }
} finally {
    await rm(temporary, { recursive: true, force: true });
}