/** Prompt for and scaffold composable files in the selected project’s resolved directories. */
import { projectDirectory } from '../utils/nuxt';
import { window } from 'vscode'
import { composableTemplate } from '../templates'
import { createDir, createFile, createSubFolders, normalizeFileExtension, projectSrcDirectory, showSubFolderQuickPick } from '../utils'

/** Prompt for a name and create the selected composable scaffold. */
const neglectUsePrefix = (name: string) => name.replace(/^use/i, '')

/** Prompt for a name and create the selected composable scaffold. */
const createComposable = () => {
    window
        .showInputBox({
            prompt: 'What is your composable name?',
            placeHolder: 'composable name',
        })
        .then(async (name) => {

            if (!name) { return }

            const composablesDir = projectDirectory('composables')

            createDir('composables')

            const subFolders = await createSubFolders(composablesDir, 'composables')

            showSubFolderQuickPick({
                name,
                subFolders,
                commandType: 'composables',
                content: composableTemplate(neglectUsePrefix(name)),
            })

        })
}

/** Create a file in the Explorer folder supplied by the command. */
const directCreateComposable = (path: string) => {
    window
        .showInputBox({
            prompt: 'What is your composable name?',
            placeHolder: 'composable name',
        })
        .then((name) => {
            if (!name) { return }

            const filePath = `${path}/${normalizeFileExtension(name, '.ts')}.ts`

            createFile({
                fileName: `${name}.ts`,
                content: composableTemplate(neglectUsePrefix(name)),
                fullPath: filePath,
            })
        })
}

export { createComposable, directCreateComposable }
