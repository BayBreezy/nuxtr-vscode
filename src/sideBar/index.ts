/** Present the Vue sidebar and dispatch project dependency, module and template actions. */
import { SidebarEvent, parseSidebarRequest } from '../core/messages';
import { ProjectContext } from '../core/project';
import { currentProject, withProject } from '../services/project';
import { managerCommand, terminalCommand } from '../core/managers';
import { choosePackageManager } from '../utils/dependency';
import { ModuleMetadata, canonicalPackageName, installThenConfigure, moduleIsDevelopment } from '../core/modules';
import { existsSync, readFileSync, readdirSync, unlinkSync } from 'node:fs'
import { capitalize } from 'string-ts'
import * as vscode from 'vscode'

import {
    detectPackageManagerByName,
    getInstallationCommand,
    getNonce,
    getOutdatedPackages,
    getProjectDependencies,
    getProjectScripts,
    getUri,
    managePackageVersion,
    newTerminal,
    openExternalLink,
    projectRootDirectory,
    removeNuxtModule,
    removePackage,
    runCommand,
    updateNuxtConfig
} from '../utils'

import commands from '../commands'


export class ModulesView implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView
    private listeners: vscode.Disposable[] = [];
    private project?: ProjectContext;
    private request = 0;
    private route: 'projectView' | 'modules' = 'projectView';
    private pendingAction?: 'addModule' | 'addLayer';

    /** Keep the extension URI for packaged asset resolution. */
    constructor (private readonly _extensionUri: vscode.Uri) {}

    /** Initialize the webview and bind sidebar visibility and messages. */
    public resolveWebviewView (webviewView: vscode.WebviewView) {
        this.dispose();
        this._view = webviewView

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        }

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview)
        this._setWebviewMessageListener(webviewView.webview)

        // in case the user reload the window while opening the extension tab
        if (webviewView.visible) {
            this.goToProjectView()
        }

        this.listeners.push(webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                this.goToProjectView()
            }
        }), webviewView.onDidDispose(() => this.dispose()));
    }

    /** Dispose listeners whenever the sidebar is replaced or the extension shuts down. */
    public dispose () { for (const listener of this.listeners.splice(0)) { listener.dispose(); } this._view = undefined; }

    /** Request sidebar project navigation and refresh its project data. */
    public goToProjectView () {
        this.postMessage({ command: 'projectView' })
        void this.getDependencies().catch(error => { vscode.window.showErrorMessage(String(error)); })
    }

    /** Send project package, template and update metadata to the sidebar. */
    public async getDependencies () {
        this.project = currentProject();
        const request = ++this.request;
        const dependencies = await getProjectDependencies()
        const scripts = getProjectScripts()

        const vscodeVersion = vscode.version
        const extension_version = existsSync(`${this._extensionUri.fsPath}/package.json`)
            ? JSON.parse(readFileSync(`${this._extensionUri.fsPath}/package.json`, 'utf8')).version
            : 'undefined'
        const feedbackContent = {
            vscode_version: vscodeVersion,
            extension_version,
            vscode_theme_id: vscode.workspace.getConfiguration().get('workbench.colorTheme'),
        }

        // regex find list of snippets inside .vscode folder
        const snippets = existsSync(`${projectRootDirectory()}/.vscode`)
            ? readdirSync(`${projectRootDirectory()}/.vscode`)
                .filter((file) => file.match(/.*\.code-snippets/))
            : []

        // regex find list of file templates inside .vscode folder
        const fileTemplates = existsSync(`${projectRootDirectory()}/.vscode`)
            ? readdirSync(`${projectRootDirectory()}/.vscode`)
                .filter((file) => file.match(/.*\.(page-template|layout-template)/))
            : []

        if (request !== this.request) { return; }
        this.postMessage({
            command: 'projectViewData',
            data: {
                dependencies,
                scripts,
                feedbackContent,
                snippets,
                fileTemplates
            },
        })

        await this.updateModules();

        let outdatedDependencies: any;
        try { outdatedDependencies = await getOutdatedPackages(); } catch (error) {
            if (request === this.request) { this.postMessage({ command: 'outdatedDependencies', data: [] }); }
            throw error;
        }
        if (request !== this.request) { return; }

        outdatedDependencies = JSON.parse(outdatedDependencies)

        if (outdatedDependencies) {
            outdatedDependencies = Object.keys(outdatedDependencies).map((key) => {
                return {
                    current: outdatedDependencies[key].current,
                    latest: outdatedDependencies[key].latest,
                    wanted: outdatedDependencies[key].wanted,
                    dependent: outdatedDependencies[key].dependent,
                    name: key,
                }
            })

            await vscode.commands.executeCommand('nuxtr.globalState', { update: true, name: 'outdatedDependencies', value: outdatedDependencies })

            this.postMessage({
                command: 'outdatedDependencies',
                data: outdatedDependencies,
            })
        }
    }

    /** Execute a declared script with the selected manager, separating scripts from local CLI actions. */
    public async runAction (script: string) {
        if (!Object.hasOwn(getProjectScripts(), script)) { throw new Error('The selected script does not exist in this project.'); }
        const manager = await choosePackageManager();
        if (!manager) { return; }
        const command = managerCommand(manager, 'script', projectRootDirectory(), [script]);
        if (script.includes('build') || script.includes('generate')) {
            await runCommand({ command, message: `Nuxtr: ${script}`, successMessage: `${script} finished`, errorMessage: `${script} failed`, logger: true });
        } else { newTerminal(`Project: ${script}`, terminalCommand(command), command.cwd); }
    }

    /** Send the current project’s installed dependency list to the module view. */
    public async updateModules () {
        const installedModules = await getProjectDependencies()
        this.postMessage({
            command: 'installedModules',
            data: installedModules,
        })
    }

    /** Send an extension-host event to the current webview when available. */
    public postMessage (message: SidebarEvent) {
        if (message.command === 'projectView' || message.command === 'modules') { this.route = message.command; }
        if (message.command === 'addModule' || message.command === 'addLayer') { this.pendingAction = message.command; }
        if (this._view) {
            this._view.webview.postMessage(message)
        }
    }

    /** Render the sidebar shell with local JS/CSS asset URIs. */
    private _getHtmlForWebview (webview: vscode.Webview) {
        const nonce = getNonce();
        const stylesUri = getUri(webview, this._extensionUri, ['src', 'sideBar', 'build', 'assets', 'index.css'])
        // The JS file from the Vue build output
        const scriptUri = getUri(webview, this._extensionUri, ['src', 'sideBar', 'build', 'assets', 'index.js'])

        return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; script-src 'nonce-${nonce}'; connect-src 'none';">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Nuxtr UI</title>
        </head>
        <body>
          <div id="app"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `
    }

    /** Install first, then edit configuration; report an installed package separately from a failed config edit. */
    private async installModule (module: ModuleMetadata) {
        const name = canonicalPackageName(module);
        const result = await installThenConfigure(
            async () => {
                const command = await getInstallationCommand(name, moduleIsDevelopment(module));
                return runCommand({ command, message: `Installing ${name}`, successMessage: `${name} installed`, errorMessage: `Failed to install ${name}`, logger: true });
            },
            () => updateNuxtConfig('add-module', name)
        );
        this.postMessage({ command: 'moduleInstalled', installed: result.installed, configured: result.configured, cmd: name });
        if (!result.installed) { return; }
        await this.updateModules();
        if (result.configured) { vscode.window.showInformationMessage(`${name} installed and configured.`); }
        else { vscode.window.showErrorMessage(`${name} is installed, but its Nuxt config edit failed: ${String(result.error)}. Add it manually to modules/extends.`); }
    }

    /** Upgrade a selected module through dependency management. */
    public async upgradeModule (module: any) {
        await managePackageVersion(module)
    }

    /** Remove a Nuxt module and its corresponding configuration entry. */
    public async removeModule (module: any) {
        // show confirmation message
        const confirmation = await vscode.window.showInformationMessage(
            `Are you sure you want to remove ${module}?`,
            'Yes',
            'No'
        )
        if (confirmation === 'Yes') {
            const name = canonicalPackageName(module);
            await removePackage(name);
            try { removeNuxtModule(name); } catch (error) { vscode.window.showErrorMessage(`${name} removed, but configuration cleanup failed: ${String(error)}`); }
            await this.updateModules();
        }
    }
    /** Open a project snippet file in the editor. */
    public editSnippet (snippet: string) {
        const snippetPath = `${projectRootDirectory()}/.vscode/${snippet}`
        if (existsSync(snippetPath)) {
            vscode.window.showTextDocument(vscode.Uri.file(snippetPath))
        } else {
            vscode.window.showErrorMessage(`Snippet ${snippet} not found`)
        }
    }

    /** Open a project template file in the editor. */
    public editTemplate (snippet: string) {
        const snippetPath = `${projectRootDirectory()}/.vscode/${snippet}`
        if (existsSync(snippetPath)) {
            vscode.window.showTextDocument(vscode.Uri.file(snippetPath))
        } else {
            vscode.window.showErrorMessage(`Snippet ${snippet} not found`)
        }
    }

    /** Confirm and remove an existing project template. */
    public async deleteTemplate (template: string) {
        //  create a confirmation message to delete the template
        const confirmation = await vscode.window.showInformationMessage(
            `Are you sure you want to delete ${template}?`,
            'Yes',
            'No'
        )
        if (confirmation === 'Yes') {
            const templatePath = `${projectRootDirectory()}/.vscode/${template}`
            if (existsSync(templatePath)) {
                unlinkSync(templatePath)
            } else {
                vscode.window.showErrorMessage(`Template ${template} not found`)
            }
        }

    }

    /** Confirm and remove an existing project snippet. */
    public async deleteSnippet (snippet: string) {
        //  create a confirmation message to delete the template
        const confirmation = await vscode.window.showInformationMessage(
            `Are you sure you want to delete ${snippet}?`,
            'Yes',
            'No'
        )
        if (confirmation === 'Yes') {
            const snippetPath = `${projectRootDirectory()}/.vscode/${snippet}`
            if (existsSync(snippetPath)) {
                unlinkSync(snippetPath)
            } else {
                vscode.window.showErrorMessage(`Snippet ${snippet} not found`)
            }
        }

    }

    /** Validate and await a sidebar action in the project that supplied the displayed data. */
    private _setWebviewMessageListener (webview: vscode.Webview) {
        this.listeners.push(webview.onDidReceiveMessage(async (raw: unknown) => {
            const message = parseSidebarRequest(raw);
            if (!message) { return; }
            try {
                if (message.command === 'openExternal') { await openExternalLink(message.url); return; }
                await withProject(this.project || currentProject(), async () => {
                    switch (message.command) {
                        case 'ready': { this.postMessage({ command: this.route }); if (this.pendingAction) { this.postMessage({ command: this.pendingAction }); } await this.getDependencies(); break; }
                        case 'installModule': { await this.installModule(message.module); break; }
                        case 'runAction': { await this.runAction(message.script); break; }
                        case 'upgradeModule': { await this.upgradeModule(message.module); break; }
                        case 'removeModule': { await this.removeModule(message.module); break; }
                        case 'editSnippet': { this.editSnippet(message.data); break; }
                        case 'deleteSnippet': { await this.deleteSnippet(message.data); break; }
                        case 'editTemplate': { this.editTemplate(message.data); break; }
                        case 'deleteTemplate': { await this.deleteTemplate(message.data); break; }
                        case 'configureNewSnippet': { await vscode.commands.executeCommand('workbench.action.openSnippets'); break; }
                        case 'createFileFromTemplate': { await vscode.commands.executeCommand('nuxtr.createFileFromTemplate', message.data); break; }
                        case 'createEmptyFileTemplate': { await vscode.commands.executeCommand('nuxtr.createEmptyFileTemplate'); break; }
                    }
                });
            } catch (error) { vscode.window.showErrorMessage(String(error)); }
        }));
    }
}
