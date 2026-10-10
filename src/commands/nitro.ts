/** Prompt for and scaffold nitro files in the selected project’s resolved directories. */
import { projectDirectory } from '../utils/nuxt';
import { window } from 'vscode';
import { nitroDefaultTemplate, nitroPluginTemplate, nitroUtilTemplate } from '../templates';
import { createDir, createFile, createSubFolders, hasServerDir, normalizeFileExtension, projectSrcDirectory, showSubFolderQuickPick } from '../utils';

/** Prompt for a name and create the selected nitro scaffold. */
const createNitroAPI = () => {
    window
        .showInputBox({
            prompt: 'What is your API name?',
            placeHolder: 'API name',
        })
        .then(async (name) => {
            if (!name) {
                return;
            }
            const serverDirName = await hasServerDir();
            await createDir(`${serverDirName}`);
            await createDir(`${serverDirName}/api`);
            const apisDir = `${await projectSrcDirectory()}/${await hasServerDir()}/api`

            const subFolders = await createSubFolders(apisDir, 'api');

            showSubFolderQuickPick({
                name,
                subFolders,
                commandType: 'api',
                content: nitroDefaultTemplate
            });
        });
};

/** Prompt for a name and create the selected nitro scaffold. */
const createNitroRoute = () => {
    window
        .showInputBox({
            prompt: 'What is your route name?',
            placeHolder: 'Route name',
        })
        .then(async (name) => {
            if (!name) {
                return;
            }
            const serverDirName = await hasServerDir();
            await createDir(`${serverDirName}`);
            await createDir(`${serverDirName}/routes`);
            const composablesDir = `${await projectSrcDirectory()}/${await hasServerDir()}/routes`

            const subFolders = await createSubFolders(composablesDir, 'route');

            showSubFolderQuickPick({
                name,
                subFolders,
                commandType: 'route',
                content: nitroDefaultTemplate
            });
        });
}

/** Prompt for a name and create the selected nitro scaffold. */
const createNitroPlugin = () => {
    window
        .showInputBox({
            prompt: 'What is your plugin name?',
            placeHolder: 'Plugin name',
        })
        .then(async (name) => {
            if (!name) {
                return;
            }
            const serverDirName = await hasServerDir();
            await createDir(`${serverDirName}`);
            await createDir(`${serverDirName}/plugins`);
            const composablesDir = `${await projectSrcDirectory()}/${await hasServerDir()}/plugins`

            const subFolders = await createSubFolders(composablesDir, 'nitroPlugin');

            showSubFolderQuickPick({
                name,
                subFolders,
                commandType: 'nitroPlugin',
                content: nitroPluginTemplate
            });
        });
}

/** Prompt for a name and create the selected nitro scaffold. */
const createNitroUtil = () => {
    window
        .showInputBox({
            prompt: 'What is your utility name?',
            placeHolder: 'Utility name',
        })
        .then(async (name) => {
            if (!name) {
                return;
            }
            const serverDirName = await hasServerDir();
            await createDir(`${serverDirName}`);
            await createDir(`${serverDirName}/utils`);
            const composablesDir = `${await projectSrcDirectory()}/${await hasServerDir()}/utils`

            const subFolders = await createSubFolders(composablesDir, 'nitroUtil');

            showSubFolderQuickPick({
                name,
                subFolders,
                commandType: 'nitroUtil',
                content: nitroUtilTemplate
            });
        });

}

/** Prompt for a name and create the selected nitro scaffold. */
const createNitroMiddleware = () => {
    window
        .showInputBox({
            prompt: 'What is your middleware name?',
            placeHolder: 'Middleware name',
        })
        .then(async (name) => {
            if (!name) {
                return;
            }
            const serverDirName = await hasServerDir();
            await createDir(`${serverDirName}`);
            await createDir(`${serverDirName}/middleware`);
            const middlewareDir = `${await projectSrcDirectory()}/${await hasServerDir()}/middleware`
            const subFolders = await createSubFolders(middlewareDir, 'nitroMiddleware');

            showSubFolderQuickPick({
                name,
                subFolders,
                commandType: 'nitroMiddleware',
                content: nitroDefaultTemplate
            });
        });
}


/** Create a file in the Explorer folder supplied by the command. */
const directCreateNitroAPI = (path: string) => {
    window
        .showInputBox({
            prompt: 'What is your api name?',
            placeHolder: 'api name',
        })
        .then(async (name) => {
            if (!name) { return }

            await createDir('server')
            await createDir('server/api')

            const filePath = `${path}/${normalizeFileExtension(name, '.ts')}.ts`
            createFile({
                fileName: `${name}.ts`,
                content: nitroDefaultTemplate,
                fullPath: filePath,
            })
        })
}

/** Create a file in the Explorer folder supplied by the command. */
const directCreateNitroRoute = (path: string) => {
    window
        .showInputBox({
            prompt: 'What is your route name?',
            placeHolder: 'Route name',
        })
        .then((name) => {
            if (!name) { return }

            createDir('server')
            createDir('server/routes')

            const filePath = `${path}/${normalizeFileExtension(name, '.ts')}.ts`

            createFile({
                fileName: `${name}.ts`,
                content: nitroDefaultTemplate,
                fullPath: filePath,
            })
        })
}

export {
    createNitroAPI, createNitroMiddleware, createNitroPlugin, createNitroRoute, createNitroUtil, directCreateNitroAPI, directCreateNitroRoute
};
