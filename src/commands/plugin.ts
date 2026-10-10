/** Prompt for and scaffold plugin files in the selected project’s resolved directories. */
import { containsPath } from '../core/project';
import { scaffoldExtension } from '../utils/files';
import { projectDirectory } from '../utils/nuxt';
import { window } from 'vscode'
import { nitroPluginTemplate, nuxtPluginTemplate } from '../templates'
import { createDir, createFile, createSubFolders, hasServerDir, normalizeFileExtension, projectSrcDirectory, showSubFolderQuickPick } from '../utils'

/** Prompt for a name and create the selected plugin scaffold. */
const createPlugin = () => {
    return window
        .showInputBox({
            prompt: 'What is your plugin name?',
            placeHolder: 'plugin name',
        })
        .then(async (name) => {
            if (!name) { return }

            const pluginsDir = projectDirectory('plugins')

            await createDir('plugins')

            const subFolders = await createSubFolders(pluginsDir, 'plugins')

            return showSubFolderQuickPick({
                name,
                subFolders,
                commandType: 'plugins',
                content: nuxtPluginTemplate
            })

        })
}


/** Create a file in the Explorer folder supplied by the command. */
const directCreatePlugin = async (path: string) => {
    const serverDir = await hasServerDir()

    return window
        .showInputBox({
            prompt: 'What is your plugin name?',
            placeHolder: 'plugin name',
        })
        .then((name) => {
            if (!name) { return }

            const filePath = `${path}/${normalizeFileExtension(name, scaffoldExtension())}${scaffoldExtension()}`


            return createFile({
                fileName: `${name}${scaffoldExtension()}`,
                content: containsPath(projectDirectory('server'), filePath) ? nitroPluginTemplate : nuxtPluginTemplate,
                fullPath: filePath,
            })
        })
}

export { createPlugin, directCreatePlugin }
