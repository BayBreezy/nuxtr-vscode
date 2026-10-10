/** Prompt for and scaffold middleware files in the selected project’s resolved directories. */
import { containsPath } from '../core/project';
import { scaffoldExtension } from '../utils/files';
import { projectDirectory } from '../utils/nuxt';
import { window } from 'vscode'
import { nuxtMiddlewareTemplate, serverMiddlewareTemplate } from '../templates'
import { createDir, createFile, createSubFolders, hasServerDir, normalizeFileExtension, projectSrcDirectory, showSubFolderQuickPick } from '../utils'

/** Prompt for a name and create the selected middleware scaffold. */
const createMiddleware = () => {
    return window
        .showInputBox({
            prompt: 'What is your middleware name?',
            placeHolder: 'middleware name',
        })
        .then(async (name) => {

            if (!name) { return }

            const middlewareDir = projectDirectory('middleware')

            await createDir('middleware')

            const subFolders = await createSubFolders(middlewareDir, 'middleware')

            return showSubFolderQuickPick({
                name,
                subFolders,
                commandType: 'middleware',
                content: nuxtMiddlewareTemplate
            })


        })
}

/** Create a file in the Explorer folder supplied by the command. */
const directCreateMiddleware = async (path: string) => {
    const serverDir = await hasServerDir()

    return window
        .showInputBox({
            prompt: 'What is your middleware name?',
            placeHolder: 'middleware name',
        })
        .then((name) => {
            if (!name) { return }

            const filePath = `${path}/${normalizeFileExtension(name, scaffoldExtension())}${scaffoldExtension()}`

            return createFile({
                fileName: `${name}${scaffoldExtension()}`,
                content: containsPath(projectDirectory('server'), filePath) ? serverMiddlewareTemplate : nuxtMiddlewareTemplate,
                fullPath: filePath,
            })
        })
}

export { createMiddleware, directCreateMiddleware }
