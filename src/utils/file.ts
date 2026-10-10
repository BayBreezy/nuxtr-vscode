/** Create protected project files and directory/template pickers for the selected Nuxt context. */
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { TextEncoder } from 'node:util';
import { dirname, isAbsolute, resolve } from 'node:path';
import { DirectoryKind } from '../core/directories';
import { projectDirectories } from './nuxt';
import { join } from 'pathe';
import { capitalize, endsWith, replace, split, trim } from 'string-ts';
import { Uri, window, workspace } from 'vscode';

import { getCommandType } from './commands';

import { nuxtrConfiguration, projectRootDirectory, projectSrcDirectory } from '.';


/** Prompt for a subfolder and create it under the resolved command directory. */
const createDirectoryAndFile = async (componentName: any, commandType: string, content: string) => {

    const { type } = await getCommandType(commandType);

    window
        .showInputBox({
            prompt: 'What is your directory name?',
            placeHolder: 'Directory name',
        })
        .then(async (name) => {
            if (name !== undefined && trim(name) !== '') {

                const workspaceFolder = workspace.workspaceFolders?.[0];
                const cwd = workspaceFolder?.uri.fsPath;

                if (cwd !== undefined) {
                    const dir = resolve(await projectSrcDirectory(), type.path);
                    const directoryPath = join(dir, name);

                    if (existsSync(directoryPath)) {
                        window.showWarningMessage(
                            `Directory ${name} already exists in ./${type.path}/${name}`
                        );
                    } else {
                        await workspace.fs.createDirectory(Uri.file(directoryPath));

                        createFile({
                            fileName: componentName,
                            content,
                            fullPath: `${await projectSrcDirectory()}/${type.path}/${name}/${normalizeFileExtension(componentName, type.extension)}${type.extension}`,
                        });
                    }
                }
            }
        });
};

/** Await creation of a logical or relative directory using the resolved Nuxt layout. */
export const createDir = async (dir: string) => {
    const directories = projectDirectories();
    const configured = directories[dir as DirectoryKind];
    const target = configured || (isAbsolute(dir) ? dir : resolve(directories.app, dir));
    await workspace.fs.createDirectory(Uri.file(target));
};

/** List immediate subfolders for the scaffold picker. */
export const createSubFolders = async (dir: string, commandType: string) => {
    const subFolders =
        readdirSync(dir, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name);

    const { type } = await getCommandType(commandType);


    subFolders.unshift('Create new folder...');
    subFolders.push(`Main ${type.name.toLocaleLowerCase()} folder`);

    return subFolders;
};

/** Prompt for a destination and create the selected scaffold without overwriting a file. */
export const showSubFolderQuickPick = async (args: {
    subFolders?: any
    name: string
    commandType: string
    content: any
}) => {
    const { type } = await getCommandType(args.commandType);

    window
        .showQuickPick(args.subFolders, { placeHolder: 'Select a subfolder' })
        .then(async (selection) => {
            if (selection === undefined) {
                return;
            }

            switch (selection) {
                case `Main ${type.name.toLocaleLowerCase()} folder`: {
                    const path = `${normalizeFileExtension(args.name, type.extension)}${type.extension}`;
                    const fullPath = `${await projectSrcDirectory()}/${type.path}/${path}`;

                    createFile({
                        fileName: args.name,
                        content: args.content,
                        fullPath
                    });
                    break;
                }
                case 'Create new folder...': {
                    createDirectoryAndFile(normalizeFileExtension(args.name, type.extension), type.name, args.content);
                    break;
                }
                default: {
                    const fileNameAndPath = `${selection}/${normalizeFileExtension(args.name, type.extension)}${type.extension}`;

                    await createFile({
                        fileName: args.name,
                        content: args.content,
                        fullPath: `${await projectSrcDirectory()}/${type.path}/${fileNameAndPath}`,
                    });
                    break;
                }
            }
        });
};

/** Ensure parents exist and create a new file, preserving existing files. */
export const createFile = async (args: { fileName: string; content: string; fullPath: string }) => {
    const parentDirectory = Uri.file(args.fullPath);

    if (existsSync(parentDirectory.fsPath)) {
        window.showErrorMessage(`File ${args.fileName} already exists`);
        return;
    }

    await workspace.fs.createDirectory(Uri.file(dirname(args.fullPath)));
    await workspace.fs.writeFile(parentDirectory, new TextEncoder().encode(args.content));

    if (nuxtrConfiguration().openItemsAfterCreation) {
        workspace.openTextDocument(parentDirectory).then((doc) => {
            window.showTextDocument(doc);
        });
    }
};

/** Save a named Vue template in the selected project’s .vscode directory. */
export const createVueTemplate = (content: string, type: string) => {

    if (!existsSync(`${projectRootDirectory()}/.vscode`)) {
        mkdirSync(`${projectRootDirectory()}/.vscode`);
    }

    window
        .showInputBox({
            prompt: 'What is your page template name?',
            placeHolder: 'Page template name',
        })
        .then((name) => {
            if (name !== undefined && trim(name) !== '') {
                createFile({
                    fileName: name,
                    content,
                    fullPath: `${projectRootDirectory()}/.vscode/${name}.${type}-template`
                });
            }
        });

};

/** Convert a scaffold name into a PascalCase template identifier. */
export const normalizeName = (name: string) => split(trim(split(name, '.')[0]), '-').map((value) => capitalize(value)).join('');

/** Remove a supplied suffix before the caller appends the expected extension. */
export const normalizeFileExtension = (name: string, extension: string) => endsWith(name, extension) ? replace(name, extension, '') : name
