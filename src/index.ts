/** Activate public commands before project discovery so empty and non-Nuxt windows remain usable. */
import { ExtensionContext, commands, workspace } from 'vscode';

/** Register owned commands first, then load project services only when a Nuxt workspace is available. */
export async function activate (context: ExtensionContext) {
    context.subscriptions.push(commands.registerCommand('nuxtr.createProject', async () => {
        const { createProject } = await import('./commands/project');
        await createProject();
    }));
    const { isNuxtProject, isNuxtTwo } = await import('./utils/nuxt');
    const isNuxt = workspace.workspaceFolders?.length ? isNuxtProject() : false;
    await commands.executeCommand('setContext', 'nuxtr.isNuxtProject', isNuxt);
    await commands.executeCommand('setContext', 'nuxtr.isNuxtTwo', isNuxt ? isNuxtTwo() : false);
    if (isNuxt) {
        const { activateExtension } = await import('./extension');
        activateExtension(context);
    }
}
