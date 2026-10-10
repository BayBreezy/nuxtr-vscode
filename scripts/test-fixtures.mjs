/** Build and typecheck generated recipes in isolated, pinned Nuxt 3/4 projects without application APIs. */
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createJiti } from 'jiti';
const jiti = createJiti(import.meta.url);
const { configureTailwindSource, tailwindRecipe } = await jiti.import('../src/core/tailwind.ts');
const { executeCommand, requireSuccess } = await jiti.import('../src/core/process.ts');

/** Run a fixture check with complete diagnostics and a bounded installation/build timeout. */
async function check (root, args) {
    console.log('FIXTURE CHECK: ' + args.join(' '));
    const result = await executeCommand({ executable: 'pnpm', args, cwd: root, timeoutMs: 180_000 });
    if (!result.success) { console.error(result.stdout); console.error(result.stderr); }
    requireSuccess(result);
}

/** Generate a representative application, then freeze installed dependencies before Nuxt preparation/types/build. */
async function fixture (major, recipe) {
    const root = process.env['NUXTR_FIXTURE_' + major] || await mkdtemp(join(tmpdir(), `nuxtr-nuxt${major}-${recipe}-`));
    console.log('FIXTURE: ' + root);
    const definition = tailwindRecipe(recipe);
    const app = major === 4 ? join(root, 'app') : root;
    await mkdir(join(app, 'assets/css'), { recursive: true });
    await mkdir(join(app, 'pages'), { recursive: true });
    const dependencies = { nuxt: major === 4 ? '4.6.1' : '3.21.11', typescript: '6.0.3', 'vue-tsc': '3.3.13' };
    for (const packageSpec of definition.packages) {
        const index = packageSpec.lastIndexOf('@');
        dependencies[packageSpec.slice(0, index)] = packageSpec.slice(index + 1);
    }
    await writeFile(join(root, 'package.json'), JSON.stringify({ name: 'nuxtr-fixture', private: true, type: 'module', packageManager: 'pnpm@12.10.1', devDependencies: dependencies }, null, 2));
    await writeFile(join(root, 'tsconfig.json'), JSON.stringify(major === 3 ? { extends: './.nuxt/tsconfig.json' } : { files: [], references: ['app', 'server', 'shared', 'node'].map(context => ({ path: './.nuxt/tsconfig.' + context + '.json' })) }, null, 2));
    await writeFile(join(root, 'pnpm-workspace.yaml'), 'allowBuilds:\n  esbuild: true\nminimumReleaseAgeExclude:\n  - vue-tsc@3.3.13\n  - \'@vue/language-core@3.3.13\'\n');
    await writeFile(join(root, 'nuxt.config.ts'), configureTailwindSource('/** Generated fixture configuration. */\nexport default defineNuxtConfig({ devtools: { enabled: false }, compatibilityDate: "2026-10-01" })\n', recipe, '~/assets/css/tailwind.css'));
    await writeFile(join(app, 'assets/css/tailwind.css'), definition.css);
    await writeFile(join(app, 'app.vue'), '<!-- Generated fixture application shell. -->\n<template><NuxtPage /></template>\n');
    await writeFile(join(app, 'pages/index.vue'), '<!-- Generated fixture page verifies CSS compilation. -->\n<template><h1 class="text-3xl font-bold">Nuxtr fixture</h1></template>\n');
    await check(root, ['install']);
    await check(root, ['install', '--frozen-lockfile']);
    await check(root, ['exec', 'nuxt', 'prepare']);
    await check(root, ['exec', 'nuxt', 'typecheck']);
    await check(root, ['exec', 'nuxt', 'build']);
    console.log(`FIXTURE PASS: Nuxt ${major}, ${recipe}, ${root}`);
}
await fixture(3, 'module3');
await fixture(4, 'vite4');
