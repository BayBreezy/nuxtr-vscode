/** Smoke-test the bundled extension and sidebar in a real VS Code extension host. */
const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const vscode = require('vscode');

/** Verify public activation and, for a Nuxt workspace, project commands and packaged sidebar assets. */
exports.run = async function run () {
    const extension = vscode.extensions.all.find(e => e.packageJSON.name === 'nuxtr-vscode');
    assert(extension, 'Development extension must be installed');
    await extension.activate();
    const commands = await vscode.commands.getCommands();
    assert(commands.includes('nuxtr.createProject'), 'Project creation must be available');
    if (!['empty', 'non-nuxt'].includes(process.env.NUXTR_SCENARIO)) {
        assert(commands.includes('nuxtr.createComponent'));
        assert(commands.includes('nuxtr.createNitroTask'));
        assert(commands.includes('nuxtr.enableNitroTasks'));
        const explorer = extension.packageJSON.contributes.menus['explorer/context'];
        assert(explorer.find(menu => menu.command === 'nuxtr.projectStructure').when.includes('resourcePath in nuxtr.applicationDirectories'));
        for (const command of ['nuxtr.createNitroAPI', 'nuxtr.createNitroUtil']) {
            assert(commands.includes(command), 'Server-root actions must be registered');
            assert(explorer.find(menu => menu.command === command).when.includes('resourcePath in nuxtr.serverDirectories'));
        }
        const build = 'out/sidebar';
        assert(existsSync(join(extension.extensionPath, build, 'assets/index.js')));
        assert(existsSync(join(extension.extensionPath, build, 'assets/index.css')));
        await vscode.commands.executeCommand('workbench.view.extension.sidebar-view');
        const root = ['nested', 'two-projects'].includes(process.env.NUXTR_SCENARIO)
            ? vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, 'apps/web') : vscode.workspace.workspaceFolders[0].uri;
        const project = await vscode.commands.executeCommand('nuxtr.selectProject', root);
        assert.equal(project.root, root.fsPath);
        if (process.env.NUXTR_SCENARIO === 'two-projects') {
            const other = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, 'apps/admin');
            assert.equal((await vscode.commands.executeCommand('nuxtr.selectProject', other)).root, other.fsPath);
            await assert.rejects(vscode.commands.executeCommand('nuxtr.selectProject', vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, 'unrelated')), /outside/);
            await vscode.commands.executeCommand('nuxtr.selectProject', root);
        }
        const config = await vscode.workspace.openTextDocument(vscode.Uri.joinPath(root, 'nuxt.config.ts'));
        const lenses = await vscode.commands.executeCommand('vscode.executeCodeLensProvider', config.uri);
        assert(lenses.some(lens => lens.command?.command === 'nuxtr.createModuleAction'), 'Nuxt config module actions must be available');
        const document = await vscode.workspace.openTextDocument(vscode.Uri.joinPath(root, '.nuxtrc'));
        await vscode.window.showTextDocument(document);
        const completions = await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', document.uri, new vscode.Position(0, 0));
        assert(completions?.items.some(item => item.label === 'srcDir'), 'Nuxt configuration schema must load in the bundled host');
        const vue = await vscode.workspace.openTextDocument(vscode.Uri.joinPath(root, 'asset-test.vue'));
        const assets = await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', vue.uri, new vscode.Position(0, vue.getText().indexOf('src="/') + 6));
        assert(assets?.items.some(item => item.label === 'logo.svg'), 'Public assets must resolve outside Nuxt 4 appDir');
        const manifestPath = join(extension.extensionPath, 'package.json');
        const originalManifest = readFileSync(manifestPath, 'utf8');
        const blank = await vscode.workspace.openTextDocument(vscode.Uri.joinPath(root, 'blank.vue'));
        const enabled = await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', blank.uri, new vscode.Position(0, 0));
        assert(enabled.items.some(item => item.label === 'vueBase'));
        await vscode.workspace.getConfiguration('nuxtr').update('snippets.nuxt', false, vscode.ConfigurationTarget.Workspace);
        const disabled = await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', blank.uri, new vscode.Position(0, 0));
        assert(!disabled.items.some(item => item.label === 'vueBase'), 'Snippet toggle must apply without reload');
        await vscode.workspace.getConfiguration('nuxtr').update('snippets.nuxt', true, vscode.ConfigurationTarget.Workspace);
        const importing = await vscode.workspace.openTextDocument(vscode.Uri.joinPath(root, 'import-test.vue'));
        const importItems = await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', importing.uri, new vscode.Position(1, 12));
        assert(!importItems.items.some(item => item.label === 'vueBase'));
        const serverDirectory = process.env.NUXTR_SCENARIO === 'custom' ? 'backend' : 'server';
        for (const extension of ['ts', 'js']) {
            const server = await vscode.workspace.openTextDocument(vscode.Uri.joinPath(root, serverDirectory, 'api/snippet-test.' + extension));
            const h3 = await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', server.uri, new vscode.Position(0, 0));
            assert(h3.items.some(item => item.label === 'h3ReadBody'), 'H3 snippets must resolve the server directory in JavaScript and TypeScript');
            await vscode.workspace.getConfiguration('nuxtr').update('snippets.nitro', false, vscode.ConfigurationTarget.Workspace);
            const off = await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', server.uri, new vscode.Position(0, 0));
            assert(!off.items.some(item => item.label === 'h3ReadBody'), 'The Nitro toggle must apply to H3 without reloading');
            await vscode.workspace.getConfiguration('nuxtr').update('snippets.nitro', true, vscode.ConfigurationTarget.Workspace);
        }
        for (const uri of [vscode.Uri.joinPath(root, 'client-snippet-test.ts'), blank.uri, vscode.Uri.joinPath(root, serverDirectory, 'api/import-test.ts')]) {
            const outside = await vscode.workspace.openTextDocument(uri);
            const items = await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', uri, outside.positionAt(outside.getText().length));
            assert(!items.items.some(item => item.label === 'h3ReadBody'), 'H3 must be suppressed in application files, Vue templates and imports');
        }
        assert.equal(readFileSync(manifestPath, 'utf8'), originalManifest, 'Snippet toggles must never rewrite installed manifests');
    }
    assert(!extension.packageJSON.contributes.languages.some(x => x.id === 'Log'));
    const log = await vscode.workspace.openTextDocument({ language: 'log', content: 'INFO ordinary log output' });
    assert.equal(log.languageId, 'log', 'Nuxtr must preserve the built-in log language');
    console.log('NUXTR_SMOKE_PASS: ' + process.env.NUXTR_SCENARIO);
};
