/** Install disposable setting watchers only during project activation. */
import { existsSync } from 'node:fs';
import { readTSConfig } from 'pkg-types';
import { ExtensionContext, commands, window } from 'vscode';
import nuxtrCommands from '../commands';
import { PugConfigurationSteps } from '../commands/templates';
import { TSConfigNuxt } from '../types';
import { createConfigWatcher, getProjectDependencies, nuxtrConfiguration, projectRootDirectory } from '../utils';

/** Offer a reload for settings whose providers are still configured only at startup. */
const reloatWindowProps = () => {
    window.showInformationMessage('Configuration has been modified.', 'Reload Window').then((answer) => {
        if (answer === 'Reload Window') {
            commands.executeCommand('workbench.action.reloadWindow');
            return;
        }
    });
}

/** Register project configuration listeners and attach every listener to the extension lifetime. */
export function activateConfigWatchers (context: ExtensionContext) {

    const templatesConfigWatcher = createConfigWatcher('nuxtr.vueFiles.template.defaultLanguage', async () => {
        const options: string[] = [];

        const dependencies = await getProjectDependencies();

        if (nuxtrConfiguration().vueFiles.template.defaultLanguage === 'pug') {
            const pugDependency = dependencies.find(dep => dep.name === 'pug');

            if (!pugDependency) {
                options.push(PugConfigurationSteps.installPug);
            }

            const languagePluginPugDependency = dependencies.find(dep => dep.name === '@vue/language-plugin-pug');

            if (!languagePluginPugDependency) {
                options.push(PugConfigurationSteps.installLanguagePlugin);
            }

            const path = `${projectRootDirectory()}/tsconfig.json`;
            const tsconfig: TSConfigNuxt = await readTSConfig(path);

            if (!existsSync(path)) {
                return;
            }

            const vueCompilerPlugins: string[] = tsconfig.vueCompilerOptions?.plugins ?? [];
            if (!vueCompilerPlugins.includes('@vue/language-plugin-pug')) {
                options.push(PugConfigurationSteps.addPluginToTSConfig)
            }


            if (options.length > 0) {
                const question = window.showInformationMessage('Pug is not configured properly', 'Configure Pug')
                question.then((answer) => {
                    if (answer === 'Configure Pug') {
                        nuxtrCommands.configurePug(options);
                    }
                })


            }
        }
    });

    const intellisenseConfigWatcher = createConfigWatcher('nuxtr.intellisense', (): Promise<void> => {
        reloatWindowProps();
        return Promise.resolve();
    })
    context.subscriptions.push(templatesConfigWatcher, intellisenseConfigWatcher);
}
