/** Package-manager regressions for Bun lock variants, fallback settings and script/CLI separation (#177). */
import { afterEach, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { detectManager, managerCommand } from '../../src/core/managers';
const folders: string[] = [];
afterEach(() => { for (const root of folders.splice(0)) { rmSync(root, { recursive: true, force: true }); } });
/** Build an isolated temporary package-manager workspace. */
function fixture () { const root = mkdtempSync(join(tmpdir(), 'nuxtr-manager-')); folders.push(root); return root; }
it.each(['bun.lock', 'bun.lockb'])('detects %s', (lock) => {
    const root = fixture(); writeFileSync(join(root, lock), ''); expect(detectManager(root)).toBe('Bun');
});
it('finds the parent workspace manager and honors explicit fallback without a lock', () => {
    const root = fixture(); mkdirSync(join(root, 'app'));
    writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages: [app]'); expect(detectManager(join(root, 'app'))).toBe('pnpm');
    expect(detectManager(fixture(), 'Bun')).toBe('Bun');
});
it('distinguishes scripts from local CLI and dependency installs across all managers', () => {
    for (const manager of ['NPM', 'pnpm', 'Yarn', 'Bun'] as const) {
        expect(managerCommand(manager, 'script', '/project', ['dev']).args).toEqual(['run', 'dev']);
        expect(managerCommand(manager, 'cli', '/project', ['nuxt', 'dev']).args).not.toEqual(['run', 'nuxt', 'dev']);
        expect(managerCommand(manager, 'add', '/project', ['@nuxt/test'], true).args).toContain('-D');
    }
});
