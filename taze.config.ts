/** Read-only dependency reports; updates and installation require explicit CLI flags. */
import { defineConfig } from 'taze'

export default defineConfig({
    force: false,
    write: false,
    install: false,
    packageMode: {
        'nuxi-nightly': 'latest'
    },
    exclude: [
        '@types/vscode'
    ],
    recursive: true
})
