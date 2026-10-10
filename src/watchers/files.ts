/** Own project file watchers and refresh dependent sidebar/status views after changes. */
import { ExtensionContext, RelativePattern, StatusBarItem, workspace } from 'vscode';
import { nuxtConfigWatcher } from '../commands/devtools';
import { dependenciesUpdatesHandler, projectRootDirectory } from '../utils';
import type { ModulesView } from '../sideBar';

export default class FileWatchers {
    /** Watch the current project and dispose both watchers and callbacks with the extension. */
    constructor (sidebar: ModulesView, context: ExtensionContext, status: StatusBarItem) {
        const root = projectRootDirectory();
        const config = workspace.createFileSystemWatcher(new RelativePattern(root, '**/nuxt.config.{ts,js,mjs,cjs}'));
        const packages = workspace.createFileSystemWatcher(new RelativePattern(root, 'package.json'));
        const templates = workspace.createFileSystemWatcher(new RelativePattern(root, '.vscode/**/*'));
        /** Refresh project views and settle dependency status after a manifest change. */
        const refresh = async () => {
            try {
                await sidebar.updateModules();
                await sidebar.getDependencies();
                await dependenciesUpdatesHandler(status);
            } catch { status.text = '$(warning)'; }
        };
        context.subscriptions.push(config, packages, templates,
            config.onDidChange(() => { void nuxtConfigWatcher().catch(() => { status.text = '$(warning)'; }); }),
            packages.onDidChange(refresh), packages.onDidCreate(refresh), packages.onDidDelete(refresh),
            templates.onDidCreate(refresh), templates.onDidDelete(refresh));
    }
}
