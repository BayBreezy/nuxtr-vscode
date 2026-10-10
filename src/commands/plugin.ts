/** Prompt for and scaffold plugin files in the selected project’s resolved directories. */
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

            const filePath = `${path}/${normalizeFileExtension(name, '.ts')}.ts`


            return createFile({
                fileName: `${name}.ts`,
                content: filePath.includes(`${serverDir}`) ? nitroPluginTemplate : nuxtPluginTemplate,
                fullPath: filePath,
            })
        })
}

export { createPlugin, directCreatePlugin }
