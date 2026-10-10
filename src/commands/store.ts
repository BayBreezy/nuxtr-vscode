/** Prompt for and scaffold store files in the selected project’s resolved directories. */
import { projectDirectory } from '../utils/nuxt';
import { window } from 'vscode'
import {
    createFile,
    generatePiniaTemplates,
    getInstallationCommand,
    isDependencyInstalled,
    isModuleConfigured,
    isNuxtTwo,
    normalizeFileExtension,
    projectSrcDirectory,
    runCommand,
    updateNuxtConfig
} from '../utils'

import { vuexContent } from '../templates'

/** Install and configure Pinia when the selected project does not already provide it. */
async function detectPiniaModule () {
    const moduleName = '@pinia/nuxt'
    const isConfigured = isModuleConfigured(moduleName)
    const installationCommand = await getInstallationCommand(moduleName, true)
    const isInstalled = await isDependencyInstalled(moduleName)


    if (!isInstalled ) {
        await runCommand({
            command: installationCommand,
            message: 'Installing @pinia/nuxt module',
            successMessage: 'Pinia module installed successfully',
            errorMessage: 'Pinia module installation failed',
            docsURL: 'https://pinia.vuejs.org/'
        })
    }

    if (!isConfigured) {
        await updateNuxtConfig('add-module', moduleName)
    }

}

/** Prompt for a name and create the selected store scaffold. */
const createStore = () => {
    window
        .showInputBox({
            prompt: 'What is your store name?',
            placeHolder: 'store name',
        })
        .then(async (name: any) => {
            if (!name) { return }

            const filePath = `${projectDirectory(isNuxtTwo() ? 'store' : 'stores')}/${name}.${isNuxtTwo() ? 'js' : 'ts'}`
            await (isNuxtTwo() ? createFile({
                fileName: name,
                content: vuexContent,
                fullPath: filePath,
            }) : createFile({
                fileName: name,
                content: generatePiniaTemplates(name),
                fullPath: filePath,
            }));

            await detectPiniaModule()
        })
}

/** Create a file in the Explorer folder supplied by the command. */
const directCreateStore = (path: string) => {
    window
        .showInputBox({
            prompt: 'What is your store name?',
            placeHolder: 'store name',
        })
        .then(async (name) => {
            if (!name) { return }

            const filePath = `${path}/${normalizeFileExtension(name, isNuxtTwo() ? '.js' : '.ts' )}.${isNuxtTwo() ? 'js' : 'ts'}`

            await (isNuxtTwo() ? createFile({
                fileName: name,
                content: vuexContent,
                fullPath: filePath,
            }) : createFile({
                fileName: name,
                content: generatePiniaTemplates(name),
                fullPath: filePath,
            }));

            await detectPiniaModule()
        })
}

export { createStore, directCreateStore }
