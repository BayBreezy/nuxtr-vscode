/** Verify successful installation can configure the project while its informational toast is still open. */
import { expect, it, vi } from 'vitest';
vi.mock('vscode', () => ({
    ProgressLocation: { Notification: 15 },
    workspace: { isTrusted: true },
    window: {
        withProgress: (_options: unknown, callback: any) => callback({}, { onCancellationRequested: () => ({ dispose () {} }) }),
        showInformationMessage: vi.fn(() => new Promise(() => {})),
        showErrorMessage: vi.fn()
    }
}));
vi.mock('../../src/services/project', () => ({ currentProject: () => ({ root: process.cwd() }) }));
vi.mock('../../src/utils/outputChannel', () => ({ logger: { log: vi.fn() } }));
import { runProjectCommand } from '../../src/services/process';

it('finishes the process without awaiting dismissal of the success notification', async () => {
    const output = await runProjectCommand({
        command: { executable: process.execPath, args: ['-e', 'process.stdout.write("installed")'], cwd: process.cwd() },
        message: 'Installing fixture module', successMessage: 'Installed', errorMessage: 'Failed'
    });
    expect(output).toBe('installed');
}, 1000);
