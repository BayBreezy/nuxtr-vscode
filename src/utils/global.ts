/** Shared VS Code configuration, workspace paths, terminal actions and project-local imports. */
import { randomBytes } from 'node:crypto';
import { safeExternalUrl } from '../core/messages';
import type { WorkspaceConfiguration } from 'vscode';
import { ProgressLocation, ThemeIcon, Uri, Webview, env, window, workspace } from 'vscode';
import type { NuxtrConfiguration } from '../types';
import { currentProject, projectSettingsResource } from '../services/project';
import { projectDirectory } from './nuxt';
import { logger } from './outputChannel';

/** Create a nonce for scripts loaded by the sidebar webview. */
export const getNonce = () => {
    return randomBytes(24).toString('base64url');
};

/** Convert an extension asset path into a URI the webview can load. */
export const getUri = (webview: Webview, extensionUri: Uri, pathList: string[]) => {
    return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
};

/** Resolve the current project root, honoring the configured monorepo directory. */
export const projectRootDirectory = (): string => {
    return currentProject().root;
};


/** Resolve the application source directory declared in Nuxt configuration. */
export const projectSrcDirectory = (): string => {
    return projectDirectory('app');
};

/** Open a documentation or repository URL in the user’s browser. */
export const openExternalLink = (url: string) => {
    if (!safeExternalUrl(url)) { throw new Error('Only public HTTPS links can be opened.'); }
    return env.openExternal(Uri.parse(url));
};

/** Read Nuxtr settings from the current VS Code workspace. */
export const nuxtrConfiguration = (): NuxtrConfiguration => {
    const configuration: WorkspaceConfiguration = workspace.getConfiguration('nuxtr', projectSettingsResource());
    return configuration as unknown as NuxtrConfiguration;
};

/** Read editor settings used by file generators. */
export const vscodeConfiguration = (): WorkspaceConfiguration => {
    return workspace.getConfiguration();
}

/** Create a project terminal for each action so a busy or differently scoped terminal never receives another command. */
export const newTerminal = (terminalName: string, command: string, cwd?: string) => {
    const terminal = window.createTerminal({ name: terminalName, cwd: cwd || projectRootDirectory(), ...(process.platform === 'win32' ? { shellPath: 'powershell.exe' } : {}), iconPath: new ThemeIcon('nuxt-logo') });
    terminal.sendText(command);
    terminal.show();
    return terminal;
};

/** Execute a project command with complete results, cancellation and success/failure notifications. */
export { runProjectCommand as runCommand } from '../services/process';
