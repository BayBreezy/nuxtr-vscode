/** Run extension smoke tests through the official VS Code runner in isolated profiles. */
const { runTests } = require('@vscode/test-electron');
const { mkdtempSync, mkdirSync, writeFileSync, existsSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');

/** Launch each requested workspace independently so activation state cannot leak between cases. */
async function main () {
    const root = resolve(__dirname, '..');
    const temporary = mkdtempSync(join(tmpdir(), 'nuxtr-integration-'));
    const cases = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ['nuxt', 'nuxt4'];
    const installed = '/Applications/Visual Studio Code.app/Contents/MacOS/Code';
    const executable = process.env.VSCODE_EXECUTABLE_PATH || (existsSync(installed) ? installed : undefined);
    delete process.env.ELECTRON_RUN_AS_NODE;
    for (const scenario of cases) {
        const folder = join(temporary, scenario);
        mkdirSync(folder, { recursive: true });
        if (scenario.startsWith('nuxt')) {
            writeFileSync(join(folder, 'package.json'), JSON.stringify({ name: 'smoke', private: true, dependencies: { nuxt: scenario === 'nuxt4' ? '^4.6.1' : '^3.21.11' } }));
            writeFileSync(join(folder, 'nuxt.config.ts'), 'export default defineNuxtConfig({})\n');
            writeFileSync(join(folder, '.nuxtrc'), '\n');
            writeFileSync(join(folder, 'pnpm-lock.yaml'), 'lockfileVersion: \'9.0\'\n');
        }
        await runTests({
            extensionDevelopmentPath: root,
            extensionTestsPath: join(root, 'tests/integration/smoke.cjs'),
            vscodeExecutablePath: executable,
            version: process.env.VSCODE_TEST_VERSION || '1.141.0',
            extensionTestsEnv: { NUXTR_SCENARIO: scenario },
            launchArgs: [
                ...(scenario === 'empty' ? [] : [folder]),
                '--user-data-dir=' + join(temporary, scenario + '-profile'),
                '--extensions-dir=' + join(temporary, scenario + '-extensions'),
                '--disable-extensions', '--disable-workspace-trust', '--skip-welcome', '--skip-release-notes'
            ]
        });
    }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
