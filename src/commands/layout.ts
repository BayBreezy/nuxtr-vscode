/** Prompt for and scaffold layout files in the selected project’s resolved directories. */
import { projectDirectory } from '../utils/nuxt';
import { window } from 'vscode'
import { createDir, createFile, normalizeFileExtension, projectSrcDirectory } from '../utils'
import { generateVueFileTemplate } from '../utils/files'


/** Prompt for a name and create the selected layout scaffold. */
const createLayout = () => {
    return window
        .showInputBox({
            prompt: 'What is your layout name?',
            placeHolder: 'Layout name',
        })
        .then(async (name) => {
            if (!name) { return }

            await createDir('layouts')

            const filePath = `${await projectSrcDirectory()}/layouts/${normalizeFileExtension(name, '.vue')}.vue`

            return createFile({
                fileName: `${name}.vue`,
                content: generateVueFileTemplate('layout'),
                fullPath: filePath,
            })
        })
}

/** Create a file in the Explorer folder supplied by the command. */
const directCreateLayout = (path: string) => {
    return window
        .showInputBox({
            prompt: 'What is your layout name?',
            placeHolder: 'layout name',
        })
        .then((name) => {
            if (!name) { return }

            const filePath = `${path}/${normalizeFileExtension(name, '.vue')}.vue`

            return createFile({
                fileName: `${name}.vue`,
                content: generateVueFileTemplate('layout'),
                fullPath: filePath,
            })
        })
}

export { createLayout, directCreateLayout }
