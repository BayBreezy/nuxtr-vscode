/** Generate project-aware Vue and Pinia scaffolds, honoring configured custom templates. */
import { readFileSync } from 'node:fs';
import { nuxtrConfiguration, projectRootDirectory } from '.';
import { generateScriptTag, generateStyleTag, piniaOptionsContent, piniaSetupContent, templateTag } from '../templates';


/** Read a selected project template or use the configured default scaffold. */
export function generateVueFileTemplate (type: 'page' | 'layout', template?: string) {
    const userDefaultTemplate = template || (type === 'page'
        ? nuxtrConfiguration().vueFiles.pages.defaultTemplate
        : nuxtrConfiguration().vueFiles.layouts.defaultTemplate);

    const templatePath = `${projectRootDirectory()}/.vscode/${userDefaultTemplate}`;
    try {
        return readFileSync(templatePath).toString();
    } catch {
        return generateVueFileBasicTemplate(type);
    }
}

/** Combine Vue tags in the configured order and languages. */
export function generateVueFileBasicTemplate (type: string) {
    let fileTemplate = ''
    const templateLang = nuxtrConfiguration().vueFiles.template.defaultLanguage
    const firstTag = nuxtrConfiguration().vueFiles.firstTag
    const scriptType = nuxtrConfiguration().vueFiles.script.type
    const addStyleTag = nuxtrConfiguration().vueFiles.style.addStyleTag
    const styleLang = nuxtrConfiguration().vueFiles.style.defaultLanguage
    const isScoped = nuxtrConfiguration().vueFiles.style.alwaysScoped
    const lang = nuxtrConfiguration().vueFiles.script.defaultLanguage

    const scriptTag = generateScriptTag(scriptType, lang)

    const eol = '\n\n';

    if (firstTag === 'template') {
        fileTemplate = templateTag(type, templateLang);
        fileTemplate += eol;
        fileTemplate += scriptTag;
    } else {
        fileTemplate = scriptTag;
        fileTemplate += eol;
        fileTemplate += templateTag(type, templateLang);
    }

    if (addStyleTag) {
        fileTemplate += eol;
        fileTemplate += generateStyleTag(styleLang, isScoped);
    }

    return fileTemplate
}

/** Select the configured Pinia setup/options starter. */
export function generatePiniaTemplates (name: string) {
    return nuxtrConfiguration().piniaFiles.defaultTemplate === 'options' ? piniaOptionsContent(name) : piniaSetupContent(name)
}