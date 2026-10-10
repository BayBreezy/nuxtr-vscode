/** Inspect and edit Nuxt project configuration without evaluating application code during activation. */
import { relative } from 'node:path';
import semver from 'semver';
import { DirectoryKind, readStaticConfig, resolveDirectories } from '../core/directories';
import { configAt } from '../core/project';
import { pathExistsSync } from 'fs-extra';
import { parseModule } from 'magicast';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { trimEnd } from 'string-ts';
import { window, workspace } from 'vscode';
import { projectRootDirectory } from '.';

/** Find a supported config file in the active project, returning undefined in empty windows. */
export const findNuxtConfig = (): string | undefined => {
    if (!workspace.workspaceFolders?.length) { return; }
    try { return configAt(projectRootDirectory()); } catch { return; }
};

/** Detect installed Nuxt layers by their configuration file. */
const isLayer = (module: any) => {
    const modulePath = `${projectRootDirectory()}/node_modules/${module.npm}`;

    if (existsSync(modulePath)) {
        const nuxtConfigPath = `${modulePath}/nuxt.config.ts`;
        const result = pathExistsSync(nuxtConfigPath)
        return result ? true : false;
    }
};


/** Read whether a package is present in the project’s modules or layers configuration. */
export const isModuleConfigured = (module: string) => {
    const nuxtConfigPath = findNuxtConfig();
    const nuxtConfig = readFileSync(`${nuxtConfigPath}`, 'utf8');

    const mod = parseModule(nuxtConfig, { sourceFileName: nuxtConfigPath });

    const config =
        mod.exports.default.$type === 'function-call'
            ? mod.exports.default.$args[0]
            : mod.exports.default;

    const layer = isLayer(module);

    if (layer) {
        config.extends ||= [];
        return config.extends.includes(module);
    } else {
        config.modules ||= [];
        return config.modules.includes(module);
    }
}


/** Remove a configured module while preserving the rest of the source file. */
export const removeNuxtModule = (module: any) => {
    try {
        const nuxtConfigPath = findNuxtConfig();
        const nuxtConfig = readFileSync(`${nuxtConfigPath}`, 'utf8');

        const mod = parseModule(nuxtConfig, { sourceFileName: nuxtConfigPath });
        const config =
            mod.exports.default.$type === 'function-call'
                ? mod.exports.default.$args[0]
                : mod.exports.default;

        const layer = isLayer(module);

        if (layer) {
            config.extends ||= [];

            for (let i = 0; i < config.extends.length; i++) {
                if (config.extends[i] === module) {
                    config.extends.splice(i, 1);
                }
            }

        } else {
            config.modules ||= [];
            for (let i = 0; i < config.modules.length; i++) {
                if (config.modules[i] === module) {
                    config.modules.splice(i, 1);
                }
            }
        }


        const generated = mod.generate().code;
        writeFileSync(`${nuxtConfigPath}`, `${trimEnd(generated)}\n`, 'utf8');
    } catch (error) {
        window.showErrorMessage(
            `${module} failed to uninstall, please uninstall it manually, ${error}`
        );
    }
};

/** Check whether the current workspace root contains a Nuxt configuration. */
export const isNuxtProject = () => {
    if (!workspace.workspaceFolders?.length) { return false; }
    return Boolean(findNuxtConfig());
};

/** Read the declared Nuxt version from the active package manifest. */
export const getNuxtVersion = (): string | undefined => {
    if (!workspace.workspaceFolders?.length) { return; }
    const packageJsonPath = `${projectRootDirectory()}/package.json`;
    if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        const dependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
        };
        if ('nuxt' in dependencies) {
            const nuxtVersion = dependencies.nuxt;
            return nuxtVersion.replace('^', '');
        }
    } else {
        return;
    }
};

/** Read a literal application source-directory override. */
export const hasSrcDir = (): string => {
    return '/' + relative(projectRootDirectory(), projectDirectories().app);
};


/** Read a literal server-directory override. */
export const hasServerDir = (): string => {
    return relative(projectDirectories().app, projectDirectories().server);
};

/** Determine whether the declared project version is Nuxt 2. */
export const isNuxtTwo = (): boolean | undefined => {
    const nuxtVersion = getNuxtVersion();
    if (typeof nuxtVersion === 'string') {
        return nuxtVersion.startsWith('2') ? true : false;
    }
};


/** Apply a supported configuration edit and report errors to the user. */
export const updateNuxtConfig = (action: 'inject-eslint-devChcker' | 'add-module', input?: string) => {
    try {
        const nuxtConfigPath = findNuxtConfig();
        const nuxtConfig = readFileSync(`${nuxtConfigPath}`, 'utf8');

        const mod = parseModule(nuxtConfig, { sourceFileName: nuxtConfigPath });
        const config =
            mod.exports.default.$type === 'function-call'
                ? mod.exports.default.$args[0]
                : mod.exports.default;

        if (action === 'inject-eslint-devChcker') {
            config.eslint ||= {};
            config.eslint.checker = true;
        }

        if (action === 'add-module') {
            const layer = isLayer(input);

            if (layer) {
                config.extends ||= [];
                if (!config.extends.includes(input)) {
                    config.extends.push(input);
                }
            } else {
                config.modules ||= [];
                if (!config.modules.includes(input)) {
                    config.modules.push(input);
                }
            }
        }


        const generated = mod.generate().code;
        writeFileSync(`${nuxtConfigPath}`, `${trimEnd(generated)}\n`, 'utf8');


    } catch {
        window.showErrorMessage(
            'Failed to update nuxt config.'
        );
    }
};

/** Resolve separate application and root-level directories from the current project's static config. */
export function projectDirectories () {
    const config = findNuxtConfig();
    if (!config) { throw new Error('No Nuxt config found. Select a Nuxt project before creating files.'); }
    const declared = getNuxtVersion();
    const version = declared && semver.validRange(declared) ? semver.minVersion(declared) : undefined;
    if (!version) { throw new Error('Cannot determine the Nuxt version. Install project dependencies or use an Explorer folder to create files.'); }
    return resolveDirectories(projectRootDirectory(), readStaticConfig(config), version.major);
}

/** Resolve a logical Nuxt directory to its absolute filesystem location. */
export function projectDirectory (kind: DirectoryKind): string { return projectDirectories()[kind]; }
