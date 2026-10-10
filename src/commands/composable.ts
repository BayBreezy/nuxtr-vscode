/** Prompt for and scaffold composable files in the selected project’s resolved directories. */
import { projectDirectory } from '../utils/nuxt';
import { window } from 'vscode'
import { composableTemplate } from '../templates'
import { createDir, createFile, createSubFolders, normalizeFileExtension, projectSrcDirectory, showSubFolderQuickPick } from '../utils'

/** Remove an existing use prefix before generating the exported composable name. */
const neglectUsePrefix = (name: string) => name.replace(/^use/i, '')

/** Prompt for a name and create the selected composable scaffold. */
const createComposable = () => {
    return window
        .showInputBox({
            prompt: 'What is your composable name?',
            placeHolder: 'composable name',
        })
        .then(async (name) => {

            if (!name) { return }

            const composablesDir = projectDirectory('composables')

            await createDir('composables')

            const subFolders = await createSubFolders(composablesDir, 'composables')

            return showSubFolderQuickPick({
                name,
                subFolders,
                commandType: 'composables',
                content: composableTemplate(neglectUsePrefix(name)),
            })

        })
}

/** Create a file in the Explorer folder supplied by the command. */
const directCreateComposable = (path: string) => {
    return window
        .showInputBox({
            prompt: 'What is your composable name?',
            placeHolder: 'composable name',
        })
        .then((name) => {
            if (!name) { return }

            const filePath = `${path}/${normalizeFileExtension(name, '.ts')}.ts`

            return createFile({
                fileName: `${name}.ts`,
                content: composableTemplate(neglectUsePrefix(name)),
                fullPath: filePath,
            })
        })
}

export { createComposable, directCreateComposable }
