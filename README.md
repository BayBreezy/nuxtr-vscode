<br />

<div align="center">
    <img src="https://raw.githubusercontent.com/nuxtrdev/nuxtr-vscode/main/.github/media/logo.png" alt="Logo" width="80" height="80">
    <h3 align="center">Nuxtr VSCode</h3>
    <p align="center">An extension offering commands and tools <br /> to make your experience with Nuxt more pleasant!</p>
    <div align="center">
        <a href="https://marketplace.visualstudio.com/items?itemName=Nuxtr.nuxtr-vscode" target="_blank"><img src="https://img.shields.io/visual-studio-marketplace/v/Nuxtr.nuxtr-vscode.svg?color=blue&label=VS%20Code%20Marketplace&logo=visual-studio-code" alt="Visual Studio Marketplace Version" /></a>
        <a href="https://marketplace.visualstudio.com/items?itemName=Nuxtr.nuxtr-vscode" target="_blank"><img src="https://img.shields.io/visual-studio-marketplace/i/Nuxtr.nuxtr-vscode?color=blue&label=Installs&logo=visual-studio-code" alt="Visual Studio Marketplace Installs" /></a>
    </div>
    <br>
    <div align="center">
        <a target="_blank" href="https://github.com/nuxtrdev/nuxtr-vscode/issues/new?assignees=&labels=bug%2Ctriage&projects=&template=issue.yaml&title=%5BBug%5D%3A+"><strong>Report Bug</strong> »</a>
        ·
        <a target="_blank" href="https://github.com/nuxtrdev/nuxtr-vscode/discussions/new/choose"><strong>Share Idea/feedback</strong> »</a>
    </div>
</div>


<br>

### Compatibility and project selection

Requires VS Code **1.141.0 or newer**. Nuxt 3 and 4 are actively supported; existing Nuxt 2 workflows are retained where practical. The installed extension uses VS Code's runtime; contributors use Node 24.20.0 and pnpm 12.10.1.

Run **Nuxtr: Select Project** for nested or multiple applications. Explorer actions and completion providers use the resource's project. The existing monorepo directory setting remains an explicit override. Application directories follow Nuxt's configured layout and legacy-layout detection; server/public/shared paths are resolved separately. Computed or inherited directories require an explicit Explorer destination when safe automatic resolution is unavailable.

### Scaffolding and dependency updates

- Store reusable page, layout, component, composable and API templates in the project's `.vscode` directory. Existing page/layout template settings continue to work; `nuxtr.fileTemplates.*.defaultTemplate` selects optional additional defaults.
- `nuxtr.scaffolding.defaultLanguage` selects `ts` (default) or `js`. `nuxtr.scaffolding.composableUsePrefix` optionally generates filenames such as `useCounter.ts`; the default remains unchanged. Vue scripts use the existing Vue language setting.
- **Nuxtr: Create Nitro Task** generates nested names such as `db:migrate` inside the configured `server/tasks` directory. **Enable Experimental Nitro Tasks** is an explicit opt-in. Helpers match the installed Nitro generation. See [Nitro 2 tasks](https://v2.nitro.build/guide/tasks) and [current Nitro tasks](https://nitro.build/docs/tasks).
- Tailwind configuration offers Tailwind 4 with its Vite plugin, or the legacy Tailwind 3 Nuxt module recipe. Existing files and conflicting integrations are protected.
- pnpm default/named catalogs resolve from workspace YAML, and updates preserve catalog references. Modules default to development dependencies unless their metadata requires runtime installation.
- The module sidebar includes the official ESLint module, a bundled offline snapshot and cached successful refreshes. **Refresh catalogue** fetches the [official modules feed](https://github.com/nuxt/modules#using-cdn) through the extension host. Dependency updates provide verified GitHub release links with an npm page fallback.

Nuxt/Nitro snippet toggles apply immediately. Suggestions avoid import statements and never modify the installed extension manifest. Ordinary log files retain their existing language support.

### What does Nuxtr do?

- [Project Creation](#project-creation)
- [Directory and File Creation](#directory-and-file-creation)
- [Dependencies management](#dependencies-management)
- [IntelliSense and Auto Completion](#intellisense-and-auto-completion)
- [Nuxi CLI Integration](#nuxi-cli-integration)
- [Nuxt, Nitro and Custom Snippets](#nuxt-nitro-and-custom-snippets)
- [Personalized Vue File Templates](#personalized-vue-file-templates)
- [Support for `srcDir`, `serverDir`, and Monorepo Projects](#support-for-srcdir-serverdir-and-monorepo-projects)
- [Execute Scripts with Ease](#execute-scripts-with-ease)
- [Toggle Nuxt Devtools from your status bar](#toggle-nuxt-devtools-from-your-status-bar)
- [Search and install Nuxt integrations](#search-and-install-nuxt-integrations)
- [Install \& Configure CSS frameworks and Linters](#install--configure-css-frameworks-and-linters)

<br>
<br>

### Project Creation

Using `Nuxtr: Create Nuxt project` command, you can create a new Nuxt project with a few steps. You can choose a project starter from [Nuxt Startes](https://nuxt.new) or you can add your own project started:

```JSON
"nuxtr.projectTemplates": [
    {
        "name": "Vitesse",
        "description": " Vitesse for Nuxt 3 🏔💚⚡️ ",
        "repoURL": "https://github.com/antfu/vitesse-nuxt3",
        "branch": "main", // Optional
    },
],
```

<br>

### Directory and File Creation

Effortlessly generate all essential directories and files for your Nuxt project right from within VSCode. Utilize the command palette  or context menus to swiftly create Vue/TypeScript files, as well as special files like [`.nuxtignore`](https://nuxt.com/docs/guide/directory-structure/nuxtignore), [`.nuxtrc`](https://nuxt.com/docs/api/configuration/nuxt-config), and [`app.config.ts`](https://nuxt.com/docs/guide/directory-structure/app-config).

To initiate any creation action, simply prepend it with the prefix **`Nuxtr: Create...`** and **`Nuxtr: Nuxt project structure...`** command for creating the entire project structure.

Right-click the Nuxt application folder (`app/` in a modern Nuxt 4 layout) or a project root and select **Nuxtr: Nuxt project structure...**. Right-click the resolved server folder to select **Create new Nitro API** or **Create new Nitro Utility**; these create files under `server/api` and `server/utils`. Custom `srcDir`/`serverDir` settings and nested projects are respected.

Customize Vue file templates with these settings:

```JSON
"nuxtr.vueFiles.template.defaultLanguage": "html",
"nuxtr.vueFiles.firstTag": "template",
"nuxtr.vueFiles.script.type": "setup",
"nuxtr.vueFiles.script.defaultLanguage": "ts",
"nuxtr.vueFiles.style.addStyleTag": true,
"nuxtr.vueFiles.style.alwaysScoped": true,
"nuxtr.vueFiles.style.defaultLanguage": "scss",
"nuxtr.piniaFiles.defaultTemplate": "options"
```

Additionally, you can choose to automatically open the newly created file with:

```JSON
"nuxtr.openItemsAfterCreation": true
```

![Nuxt Project Creation](https://raw.githubusercontent.com/nuxtrdev/nuxtr-vscode/main/.github/media/file_creation.gif)

<br>
<br>

### Dependencies management

**Package Manager Detection**: Your package manager is automatically detected if a lock file exists. Alternatively, you can specify which package manager to use with the following setting:

```JSON
"nuxtr.defaultPackageManager": "pnpm"
```

**Dependencies Management**: Within the sidebar of the project view, easily remove, upgrade, or downgrade your dependencies by selecting the desired version.

**Status Bar Icon**: Keep an eye on your outdated dependencies directly from the status bar. With just a few clicks, you can initiate the update process.

<br>

![Nuxt Dependencies](https://raw.githubusercontent.com/nuxtrdev/nuxtr-vscode/main/.github/media/dependencies.gif)

<br>
<br>

### IntelliSense and Auto Completion

Nuxtr offers robust IntelliSense capabilities tailored for Vue files. This includes dynamic path completion for [NuxtLinks](https://nuxt.com/docs/api/components/nuxt-link#internal-routing) within the pages directory, and seamless handling of media resources from the [public or static directories](https://nuxt.com/docs/guide/directory-structure/public), depending on your Nuxt version. Additionally, enjoy IntelliSense support for critical configuration files like [`.nuxtignore`](https://nuxt.com/docs/guide/directory-structure/nuxtignore) and [`.nuxtrc`](https://nuxt.com/docs/guide/directory-structure/nuxtrc), ensuring precise guidance and efficient coding.

You can enable/disable IntelliSense from the settings:

```JSON
 "nuxtr.intellisense.nuxtrc": true,
 "nuxtr.intellisense.vueFiles": true,
 "nuxtr.intellisense.nuxtignore": true,
```

![IntelliSense](https://raw.githubusercontent.com/nuxtrdev/nuxtr-vscode/main/.github/media/intellisense.gif)

<br>
<br>

### Nuxi CLI Integration

The Nuxt CLI, also known as [Nuxi](https://github.com/nuxt/cli), is an essential tool for every Nuxt developer. Seamlessly integrated into Nuxtr, it enables you to effortlessly execute Nuxi commands directly from the command palette. Under the `Nuxtr: Run` prefix, you'll discover a curated set of frequently used commands at your fingertips. Additionally, you can access the complete list of Nuxi commands through the `Nuxtr: Nuxi CLI` command.

While using the CLI directly from your terminal is perfectly viable, Nuxtr's integration enhances your development experience, especially when working with multiple terminals. It introduces a structured approach to your terminal environment, categorizing commands based on their scope. This not only streamlines your workflow but also simplifies the process of adding modules, eliminating the need to recall or search for exact names.


![Nuxi CLI](https://raw.githubusercontent.com/nuxtrdev/nuxtr-vscode/main/.github/media/nuxi.gif)

<br>
<br>

### Nuxt, Nitro and Custom Snippets

**Nuxt Snippets** cover all 16 components, 33 composables and 31 utilities in the [Nuxt 4 API index](https://nuxt.com/docs/4.x/api), plus related payload/link helpers. Type a component name (or its existing alias), composable or utility name and select the Nuxtr suggestion. Definitions include official documentation links, editable defaults and version/module/experimental requirements. See the [complete snippet catalogue and local testing guide](./docs/SNIPPETS.md).

Starting 0.2.10, you can inject a dynamic snippet based on your Nuxtr Vue files configuration with `vueBase` or `vueBaseLayout`.

Nuxt Snippets are enabled by default. You can toggle them on or off using this setting:

```JSON
 "nuxtr.snippets.nuxt": true
```

**Nitro Snippets**: Nitro powers the Nuxt Server Engine. For detailed information, refer to the [Nitro Docs](https://nitro.unjs.io).

H3 v1 snippets cover all 72 request, response and advanced helpers from the [request](https://v1.h3.dev/utils/request), [response](https://v1.h3.dev/utils/response) and [advanced](https://v1.h3.dev/utils/advanced) references. In JavaScript/TypeScript files under the resolved server directory, type a helper name such as `readBody`, or its explicit alias such as `h3ReadBody`, and select the Nuxtr suggestion. Custom `serverDir` settings are supported. H3 helpers assume the Nitro 2/H3 v1 auto-imports used by Nuxt 3 and 4. Session snippets require a private `runtimeConfig.sessionPassword` secret of at least 32 characters; edit the highlighted values for your application.

Nitro Snippets are enabled by default. You can customize their behavior using this setting:

```JSON
 "nuxtr.snippets.nitro": true
```

**Custom Snippets**: Easily manage your custom snippets directly from the sidebar. Create, edit, or delete your snippets with ease. Stay tuned for more updates on this feature!

<br>
<br>

### Personalized Vue File Templates

In order to offer users greater flexibility in tailoring their Vue files, we provide the capability to create and utilize personalized templates. These templates can be set as defaults or used selectively based on the user's preference.

We currently support two types of templates to ensure a consistent user experience: `.page-template` and `.layout-template`. When Nuxt is loaded, these files are treated as regular Vue files, simplifying the editing process. Templates can be created from existing respective files via the context menu or from empty templates accessed in the sidebar.

Set your default template with these settings:

```JSON
"nuxtr.vueFiles.pages.defaultTemplate": "default.page-template",
"nuxtr.vueFiles.layouts.defaultTemplate": "default.layout-template"
```

![File Templates](https://raw.githubusercontent.com/nuxtrdev/nuxtr-vscode/main/.github/media/file_templates.gif)

<br>
<br>

### Support for `srcDir`, `serverDir`, and Monorepo Projects

> **Note:** Monorepo mode is under heavy development.

Nuxtr seamlessly integrates with projects using `srcDir` and `serverDir`, as well as monorepo setups. Set your `srcDir` or `serverDir` directly from your `nuxt.config.ts` file, and Nuxtr will detect and generate files/directories in the correct locations for you.

Example:

```JSON
  "srcDir": "src",
  "serverDir": "server"
```

For monorepo configurations, specify the directory name containing your Nuxt project in your `.vscode/settings.json`:

```JSON
  "nuxtr.monorepoMode.DirectoryName": "directory-name"
```

<br>
<br>

### Execute Scripts with Ease

Access main scripts directly from the command palette for swift execution. Should you require a custom command, you can conveniently locate it in the sidebar. With the exception of nuxt dev, all other commands operate in the background, and you can monitor the output in the VSCode output channel.

![Nuxt Scripts](https://raw.githubusercontent.com/nuxtrdev/nuxtr-vscode/main/.github/media/scripts.png)

<br>
<br>

### Toggle Nuxt Devtools from your status bar

[Nuxt Devtools](https://devtools.nuxtjs.org/) empowers you to make informed decisions about your project. Provides invaluable insights and transparency for your Nuxt application. Uncover performance gaps and effortlessly fine-tune your app configurations and more!

 Nuxtr offers a toggle directly in your VSCode statusbar. Manual toggling from nuxt.config.ts is also detected and state is synced.

![Nuxt Devtools](https://raw.githubusercontent.com/nuxtrdev/nuxtr-vscode/main/.github/media/devtools.gif)

<br>
<br>

### Search and install Nuxt integrations

Effortlessly search for and install Nuxt modules, mirroring the familiar experience of the [Nuxt Modules](https://nuxt.com/modules) directory. Once you've located your desired module and your package manager is detected, it will be seamlessly integrated into your nuxt.config file. A success message will confirm the installation, along with a quick link to access the module documentation.


Search and Install Nuxt modules with a typical searching/filters experience as [Nuxt Modules](https://nuxt.com/modules) directory. Once you have found your desired module and your package manager is detected, it will be installed and added to the nuxt.config file. A success message will be displayed, along with a button to access the module documentation.

Starting from v0.1.0, you can filter integration types (modules/layers) from the sidebar.

![Nuxt Modules](https://raw.githubusercontent.com/nuxtrdev/nuxtr-vscode/main/.github/media/modules.gif)

<br>
<br>

### Install & Configure UI Libraries, CSS frameworks, and Linters

- UI Frameworks: [Vuetify](https://nuxt.com/modules/vuetify-nuxt-module).
- CSS Frameworks: [Tailwind CSS](https://tailwindcss.nuxtjs.org) and [UnoCSS](https://unocss.dev/integrations/nuxt).
- Linters: [`Eslint`](https://eslint.nuxt.com) and [`stylelint`](https://nuxt.com/modules/stylelint).

And more coming soon.

<br>

![Nuxt Modules](https://raw.githubusercontent.com/nuxtrdev/nuxtr-vscode/main/.github/media/css_frameworks.gif)

<br>

### Contributing

We always welcome new ideas! 💚 <br>
If you have any idea, feel free to [open a discussion](https://github.com/nuxtrdev/nuxtr-vscode/discussions/new/choose) first and let's talk about it!

For local installed-VSIX testing, use the [release validation checklist](./docs/RELEASE_VALIDATION.md). It includes disposable Nuxt project flows, retained automated evidence, the six-platform/editor CI matrix and mandatory WSL checks. See the [contributor guide](./CONTRIBUTING.md) for build and test commands.

<br>

### Acknowledgements

Nuxtr relies on the following projects/repositories:

- [Nuxt Modules](https://github.com/nuxt/modules)
- [Nuxt Assets](https://github.com/nuxt/assets)
- [Tabler Icons](https://tablericons.com/)

<br>

### License

[MIT](https://raw.githubusercontent.com/nuxtrdev/nuxtr-vscode/main/LICENSE) License © 2023 with 💚

### Project health and diagnostics

Run **Nuxtr: Project Health Check and Diagnostics** in a Nuxt project to check installed Nuxt, generated types, package-manager availability, catalog references and directory resolution. The command opens a read-only inspection report in the editor. Review it, then use **Copy diagnostics** in the notification to copy it. Nothing is sent automatically; source files, environment values and absolute paths are omitted. Warnings include suggested next steps and never modify your project.
