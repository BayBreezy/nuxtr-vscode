/** Prompt for and scaffold util files in the selected project’s resolved directories. */
import { containsPath } from '../core/project';
import { scaffoldExtension } from '../utils/files';
import { projectDirectory } from '../utils/nuxt';
import { window } from 'vscode'
import { nitroUtilTemplate, nuxtUtilTemplate } from '../templates'
import { createDir, createFile, createSubFolders, hasServerDir, normalizeFileExtension, projectSrcDirectory, showSubFolderQuickPick } from '../utils'

/** Prompt for a name and create the selected util scaffold. */
const createUtil = () => {
    return window
        .showInputBox({
            prompt: 'What is your utility name?',
            placeHolder: 'utility name',
        })
        .then(async (name) => {
            if (!name) { return }

            const utilsDir = projectDirectory('utils')

            await createDir('utils')

            const subFolders = await createSubFolders(utilsDir, 'nuxtUtil')

            return showSubFolderQuickPick({
                name,
                subFolders,
                commandType: 'nuxtUtil',
                content: nuxtUtilTemplate()
            })

        })
}


/** Create a file in the Explorer folder supplied by the command. */
const directCreateUtil = async (path: string) => {
    const serverDir = await hasServerDir()

    return window
        .showInputBox({
            prompt: 'What is your utility name?',
            placeHolder: 'utility name',
        })
        .then((name) => {
            if (!name) { return }

            const filePath = `${path}/${normalizeFileExtension(name, scaffoldExtension())}${scaffoldExtension()}`


            return createFile({
                fileName: `${name}${scaffoldExtension()}`,
                content: containsPath(projectDirectory('server'), filePath) ? nitroUtilTemplate : nuxtUtilTemplate(),
                fullPath: filePath,
            })
        })
}

export { createUtil, directCreateUtil }
