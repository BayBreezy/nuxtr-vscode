/** Smoke-test the bundled extension and sidebar in a real VS Code extension host. */
const assert = require('node:assert/strict');
const { existsSync } = require('node:fs');
const { join } = require('node:path');
const vscode = require('vscode');

/** Verify public activation and, for a Nuxt workspace, project commands and packaged sidebar assets. */
exports.run = async function run () {
    const extension = vscode.extensions.all.find(e => e.packageJSON.name === 'nuxtr-vscode');
    assert(extension, 'Development extension must be installed');
    await extension.activate();
    const commands = await vscode.commands.getCommands();
    assert(commands.includes('nuxtr.createProject'), 'Project creation must be available');
    if (process.env.NUXTR_SCENARIO.startsWith('nuxt') || process.env.NUXTR_SCENARIO === 'nested') {
        assert(commands.includes('nuxtr.createComponent'));
        const build = existsSync(join(extension.extensionPath, 'out/sidebar')) ? 'out/sidebar' : 'src/sideBar/build';
        assert(existsSync(join(extension.extensionPath, build, 'assets/index.js')));
        assert(existsSync(join(extension.extensionPath, build, 'assets/index.css')));
        await vscode.commands.executeCommand('workbench.view.extension.sidebar-view');
        const root = process.env.NUXTR_SCENARIO === 'nested'
            ? vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, 'apps/web') : vscode.workspace.workspaceFolders[0].uri;
        const project = await vscode.commands.executeCommand('nuxtr.selectProject', root);
        assert.equal(project.root, root.fsPath);
        const document = await vscode.workspace.openTextDocument(vscode.Uri.joinPath(root, '.nuxtrc'));
        await vscode.window.showTextDocument(document);
        const completions = await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', document.uri, new vscode.Position(0, 0));
        assert(completions?.items.some(item => item.label === 'srcDir'), 'Nuxt configuration schema must load in the bundled host');
    }
    assert(!extension.packageJSON.contributes.languages.some(x => x.id === 'Log'));
    console.log('NUXTR_SMOKE_PASS: ' + process.env.NUXTR_SCENARIO);
};
