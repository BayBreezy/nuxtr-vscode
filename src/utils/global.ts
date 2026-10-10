/** Shared VS Code configuration, workspace paths, terminal actions and project-local imports. */
import { createJiti } from 'jiti';
import { exec } from 'node:child_process';
import type { WorkspaceConfiguration } from 'vscode';
import { ProgressLocation, ThemeIcon, Uri, Webview, env, window, workspace } from 'vscode';
import { installDependencies } from '../commands/installDependencies';
import type { NuxtrConfiguration } from '../types';
import { currentProject, projectSettingsResource } from '../services/project';
import { hasSrcDir } from './nuxt';
import { logger } from './outputChannel';

/** Create a nonce for scripts loaded by the sidebar webview. */
export const getNonce = () => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
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
export const projectSrcDirectory = async (): Promise<string> => {
    const projectRootDir = projectRootDirectory();
    const srcDir = await hasSrcDir();
    return srcDir === '/' ? projectRootDir : projectRootDir + srcDir;
};

/** Open a documentation or repository URL in the user’s browser. */
export const openExternalLink = (url: string) => {
    env.openExternal(Uri.parse(url));
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

/** Reuse a named terminal or create one, then send the requested project command. */
export const newTerminal = (terminalName: string, command: string, cwd?: string) => {
    const existingTerminal = window.terminals.find(terminal => terminal.name === terminalName);

    if (existingTerminal) {
        existingTerminal.show();
        existingTerminal.sendText(command);
    } else {
        const terminal = window.createTerminal({
            name: terminalName,
            cwd,
            iconPath: new ThemeIcon('nuxt-logo'),
        });

        terminal.sendText(command);
        terminal.show();
    }
};


/** Execute a project command with progress and success/failure notifications. */
export const runCommand = async (args: {
    command: string
    message: string
    successMessage: string
    errorMessage: string
    docsURL?: string
    // logger boolean default false
    logger?: boolean
}) => {
    await window.withProgress(
        {
            location: ProgressLocation.Notification,
            title: args.message,
            cancellable: false,
        },
        () => {
            return new Promise((resolve, reject) => {
                const child = exec(
                    args.command,
                    { cwd: projectRootDirectory() },
                    (error: any, stdout: any) => {
                        if (error) {
                            reject(error.message);
                        } else {
                            if (args.logger) {
                                logger.log(stdout);
                                logger.show();
                            }
                            resolve(stdout);
                        }
                    }
                );

                child.on('exit', async (code) => {
                    if (code === 0) {
                        if (args.docsURL) {
                            const response = await window.showInformationMessage(args.successMessage, 'Open documentation');
                            if (response === 'Open documentation') {
                                openExternalLink(args.docsURL);
                            }
                        } else {
                            window.showInformationMessage(args.successMessage);
                        }

                    } else {
                        window.showErrorMessage(args.errorMessage);
                    }
                });
            });
        }
    );
};


/** Load a package from the Nuxt project and offer installation if it is missing. */
export async function tryImport (path: string): Promise<undefined | unknown> {
    try {
        return await createJiti(projectRootDirectory(), { interopDefault: true }).import(path)
    } catch {
        const response = await window.showErrorMessage(
            'Dependencies are not installed. Install dependencies first?',
            'Install',
            'Close'
        )

        if (response === 'Install') {
            installDependencies()
        }
        return undefined;
    }
}
