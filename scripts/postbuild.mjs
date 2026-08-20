/**
 * After the export: the two files GitHub Pages needs and Next does not write.
 *
 * `.nojekyll` stops Pages running the output through Jekyll, which would drop
 * every `_next` directory and take the whole site with it.
 */

import { writeFile, access, copyFile } from 'node:fs/promises'
import { join } from 'node:path'

const out = join(process.cwd(), 'out')

await writeFile(join(out, '.nojekyll'), '')

// Pages serves 404.html for unknown paths; Next writes it for the app router,
// but only under the not-found route, so make sure one exists at the root.
try {
  await access(join(out, '404.html'))
} catch {
  await copyFile(join(out, 'index.html'), join(out, '404.html'))
}

console.log('postbuild: wrote out/.nojekyll')
