/** Serial merge gate: frozen dependencies, types, lint, tests, VSIX integrity and real-host smoke tests. */
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { inflateRawSync } = require('node:zlib');
const assert = require('node:assert/strict');

/** Read standard ZIP central-directory records and extract entries without an external unzip executable. */
function archiveEntries (file) {
    const zip = readFileSync(file);
    let end = zip.length - 22;
    while (end >= 0 && zip.readUInt32LE(end) !== 0x06_05_4B_50) { end--; }
    assert(end >= 0, 'VSIX ZIP directory is missing');
    const entries = new Map();
    let cursor = zip.readUInt32LE(end + 16);
    for (let index = 0; index < zip.readUInt16LE(end + 10); index++) {
        assert.equal(zip.readUInt32LE(cursor), 0x02_01_4B_50);
        const size = zip.readUInt32LE(cursor + 20);
        const nameLength = zip.readUInt16LE(cursor + 28);
        const name = zip.subarray(cursor + 46, cursor + 46 + nameLength).toString();
        const local = zip.readUInt32LE(cursor + 42);
        const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
        const data = zip.subarray(start, start + size);
        const method = zip.readUInt16LE(cursor + 10);
        assert([0, 8].includes(method), 'Unsupported ZIP compression');
        entries.set(name, method === 8 ? inflateRawSync(data) : data);
        cursor += 46 + nameLength + zip.readUInt16LE(cursor + 30) + zip.readUInt16LE(cursor + 32);
    }
    return entries;
}

/** Check actual packaged paths, manifest references and exclusion of local planning/development files. */
function verifyPackage (file) {
    const entries = archiveEntries(file);
    const manifest = JSON.parse(entries.get('extension/package.json').toString());
    const referenced = [manifest.main, manifest.icon,
        ...manifest.contributes.languages.map(x => x.configuration).filter(Boolean),
        ...manifest.contributes.grammars.map(x => x.path),
        ...(manifest.contributes.snippets || []).map(x => x.path)];
    for (const path of referenced) {
        assert(entries.has('extension/' + path.replace(/^\.\//, '')), 'Missing manifest asset: ' + path);
    }
    for (const path of entries.keys()) {
        assert(!/(?:PLAN\.md|PROGRESS\.md|\.tsbuildinfo)$/.test(path), 'Local artifact packaged: ' + path);
        assert(!/^extension\/(?:tests|scripts|\.agents|\.claude)\//.test(path), 'Development files packaged: ' + path);
    }
    for (const file of ['nuxt/boilerplates', 'nuxt/components', 'nuxt/composables', 'nuxt/utils', 'nitro/boilerplates', 'nitro/utils']) {
        assert(entries.has('extension/snippets/' + file + '.json'), 'Missing snippet resource: ' + file);
    }
    const sidebar = 'out/sidebar';
    assert(entries.has('extension/' + sidebar + '/assets/index.js'));
    assert(entries.has('extension/' + sidebar + '/assets/index.css'));
    console.log('PASS: VSIX manifest, sidebar assets and exclusions');
}

/** Execute one gate; any nonzero result stops validation and prevents a merge. */
function step (args) {
    console.log('CHECK: pnpm ' + args.join(' '));
    try {
        execFileSync('pnpm', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 180_000 });
    } catch (error) {
        console.error(error.stdout?.slice(-12_000) || error.message);
        console.error(error.stderr?.slice(-6000) || '');
        throw error;
    }
}

/** Run shared checks in order so builds and package-manager operations never race. */
function validate () {
    const manifest = require('../package.json');
    step(['install', '--frozen-lockfile']);
    step(['typecheck']);
    step(['typecheck:ui']);
    step(['lint']);
    if (manifest.scripts.test) { step(['test']); }
    const archive = join(tmpdir(), 'nuxtr-validation.vsix');
    step(['package', '--out', archive]);
    verifyPackage(archive);
    step(['test:extension']);
    console.log('PASS: all merge gates');
}
if (require.main === module) { validate(); }
module.exports = { archiveEntries, verifyPackage };
