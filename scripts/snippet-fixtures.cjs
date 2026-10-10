/** Expand shipped snippet defaults into isolated Nuxt fixtures so real framework types verify their signatures. */
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

/** Expand simple VS Code tab stops, remembering defaults for repeated placeholders and literal dollar signs. */
function expandSnippet (body) {
    const defaults = new Map();
    const source = Array.isArray(body) ? body.join('\n') : body;
    return source.replace(/\$\{(\d+):([^{}]*)\}/g, (_, index, value) => {
        defaults.set(index, value);
        return value;
    }).replace(/(?<!\\)\$(\d+)|\$\{(\d+)\}/g, (_, simple, braced) => defaults.get(simple || braced) || '').replace(/\\\$/g, '$');
}

/** Typecheck every H3 default in an async event handler without making network calls or executing session/proxy examples. */
function h3Fixture () {
    const snippets = JSON.parse(readFileSync(join(__dirname, '../snippets/nitro/h3.json'), 'utf8'));
    return '/** Generated H3 signature checks; examples are compiled but never executed. */\nexport default defineEventHandler(async (event) => {\n' +
        '    const examples = [\n' + Object.entries(snippets).map(([name, snippet]) =>
            '        // ' + name + '\n        async () => {\n' + expandSnippet(snippet.body).split('\n').map(line => '            ' + line).join('\n') + '\n        }'
        ).join(',\n') + '\n    ];\n    return { examples: examples.length };\n});\n';
}

module.exports = { expandSnippet, h3Fixture };
