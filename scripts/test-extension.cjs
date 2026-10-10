/** Run extension smoke tests through the official VS Code runner in isolated profiles. */
const { runTests } = require('@vscode/test-electron');
const { mkdtempSync, mkdirSync, writeFileSync, existsSync, chmodSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');

/** Launch each requested workspace independently so activation state cannot leak between cases. */
async function main () {
    const root = resolve(__dirname, '..');
    const temporary = mkdtempSync(join(process.platform === 'darwin' ? '/tmp' : tmpdir(), 'nx-'));
    const cases = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ['empty', 'non-nuxt', 'nuxt', 'nuxt4', 'nested'];
    const vueLanguage = join(temporary, 'vue-language');
    mkdirSync(vueLanguage);
    writeFileSync(join(vueLanguage, 'package.json'), JSON.stringify({ name: 'fixture-vue', publisher: 'tests', version: '1.0.0', engines: { vscode: '*' }, contributes: { languages: [{ id: 'vue', extensions: ['.vue'] }] } }));
    const installed = '/Applications/Visual Studio Code.app/Contents/MacOS/Code';
    const executable = process.env.VSCODE_EXECUTABLE_PATH || (existsSync(installed) ? installed : undefined);
    delete process.env.ELECTRON_RUN_AS_NODE;
    for (const scenario of cases) {
        const folder = join(temporary, scenario);
        mkdirSync(folder, { recursive: true });
        if (scenario.startsWith('nuxt') || scenario === 'nested') {
            const project = scenario === 'nested' ? join(folder, 'apps/web') : folder;
            mkdirSync(project, { recursive: true });
            writeFileSync(join(project, 'package.json'), JSON.stringify({ name: 'smoke', private: true, dependencies: { nuxt: scenario === 'nuxt4' ? '^4.6.1' : '^3.21.11' } }));
            writeFileSync(join(project, 'nuxt.config.ts'), 'export default defineNuxtConfig({})\n');
            writeFileSync(join(project, '.nuxtrc'), '\n');
            if (scenario === 'nuxt4') {
                mkdirSync(join(project, 'app'), { recursive: true });
                writeFileSync(join(project, 'app/app.vue'), '<template><NuxtPage /></template>');
            }
            mkdirSync(join(project, 'public'), { recursive: true });
            writeFileSync(join(project, 'public/logo.svg'), '<svg></svg>');
            writeFileSync(join(project, 'asset-test.vue'), '<template><img src="/"></template>');
            writeFileSync(join(folder, 'pnpm-lock.yaml'), 'lockfileVersion: \'9.0\'\n');
        }
        const binaries = join(folder, 'test-bin');
        mkdirSync(binaries, { recursive: true });
        writeFileSync(join(binaries, 'pm.cjs'), 'console.log(JSON.stringify({}));\n');
        for (const manager of ['pnpm', 'npm', 'yarn', 'bun']) {
            const executable = join(binaries, manager);
            writeFileSync(executable, '#!/usr/bin/env node\nconsole.log(JSON.stringify({}));\n');
            chmodSync(executable, 0o755);
            writeFileSync(executable + '.cmd', '@node "%~dp0pm.cjs" %*\r\n');
        }
        await runTests({
            extensionDevelopmentPath: [root, vueLanguage],
            extensionTestsPath: join(root, 'tests/integration/smoke.cjs'),
            vscodeExecutablePath: executable,
            version: process.env.VSCODE_TEST_VERSION || '1.141.0',
            extensionTestsEnv: { NUXTR_SCENARIO: scenario, PATH: binaries + require('node:path').delimiter + process.env.PATH },
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
