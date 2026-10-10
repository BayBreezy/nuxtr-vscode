/** Show cancellable VS Code progress around typed processes and retain complete diagnostics in the output channel. */
import { ProgressLocation, window, workspace } from 'vscode';
import { ProcessCommand, executeCommand, requireSuccess } from '../core/process';
import { currentProject } from './project';
import { logger } from '../utils/outputChannel';
export interface CommandNotification { command: string | ProcessCommand; message: string; successMessage: string; errorMessage: string; docsURL?: string; logger?: boolean; }

/** Adapt legacy package command strings to arguments without executing shell operators or interpolation. */
export function parsePackageCommand (value: string, cwd: string): ProcessCommand {
    const [executable, ...args] = value.trim().split(/\s+/);
    if (!['npm', 'pnpm', 'yarn', 'bun', 'npx'].includes(executable)) { throw new Error('Only a typed executable or supported package-manager command can run.'); }
    return { executable, args, cwd };
}

/** Execute a trusted project action, resolving only after success and rejecting installation failure before config edits. */
export async function runProjectCommand (notification: CommandNotification): Promise<string> {
    if (!workspace.isTrusted) { throw new Error('Trust this workspace before running project commands.'); }
    const command = typeof notification.command === 'string' ? parsePackageCommand(notification.command, currentProject().root) : notification.command;
    return await window.withProgress({ location: ProgressLocation.Notification, title: notification.message, cancellable: true }, async (_, token) => {
        const controller = new AbortController();
        const cancellation = token.onCancellationRequested(() => controller.abort());
        try {
            const result = await executeCommand(command, controller.signal);
            if (notification.logger || !result.success || result.stderr) { logger.log(result.stdout); logger.log(result.stderr); }
            requireSuccess(result);
            if (notification.docsURL) {
                const choice = await window.showInformationMessage(notification.successMessage, 'Open documentation');
                if (choice) { const { env, Uri } = await import('vscode'); await env.openExternal(Uri.parse(notification.docsURL)); }
            } else {
                // An informational toast must not delay module configuration or the sidebar completion event.
                void window.showInformationMessage(notification.successMessage);
            }
            return result.stdout;
        } catch (error) {
            logger.log(String(error));
            window.showErrorMessage(`${notification.errorMessage}: ${String(error)}`);
            throw error;
        } finally { cancellation.dispose(); }
    });
}
