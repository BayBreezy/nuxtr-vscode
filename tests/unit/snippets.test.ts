/** Snippet regressions for import statements and packaged snippet formats (#182, #183, #188). */
import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { isImportContext, parseSnippets } from '../../src/core/snippets';
it.each(['import { vue', 'import x from "vue', 'import {\n  vue', 'import type {\n Vue'])('suppresses import-context snippets: %s', prefix => { expect(isImportContext(prefix)).toBe(true); });
it('keeps ordinary lines after completed imports eligible', () => {
    expect(isImportContext('import { ref } from "vue"\n\nvue')).toBe(false);
    expect(isImportContext('<template>\nvue')).toBe(false);
});
it('loads all packaged snippet files and preserves tab stops and alternate prefixes', () => {
    for (const file of ['nuxt/boilerplates', 'nuxt/components', 'nuxt/composables', 'nuxt/utils', 'nitro/boilerplates', 'nitro/utils']) {
        expect(parseSnippets(JSON.parse(readFileSync(`snippets/${file}.json`, 'utf8'))).length).toBeGreaterThan(0);
    }
    expect(parseSnippets({ sample: { prefix: ['one', 'two'], body: ['$1', '$2'] } })[0]).toMatchObject({ prefixes: ['one', 'two'], body: '$1\n$2' });
});
