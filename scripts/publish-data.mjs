/**
 * Copy the derived database into the export.
 *
 * ODbL is share-alike: the geometry and metrics in `data/out` are a derived
 * database, so they are not merely attributed but *offered* (PRD §7, DESIGN.md
 * §9). Putting them under `public/` is what makes the offer real — a reader can
 * take the numbers and the geometry and do their own work with them.
 *
 * `public/data` is generated and git-ignored; `data/out` is the source of truth
 * and is what is committed.
 */

import { copyFile, cp, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'

const from = join(process.cwd(), 'data', 'out')
const to = join(process.cwd(), 'public', 'data')

await rm(to, { recursive: true, force: true })
await mkdir(to, { recursive: true })
await cp(from, to, { recursive: true })

/*
 * The candidate survey is part of the derived database too — same radius, same
 * mapping, same code — so it is offered on the same terms. It lives outside
 * `data/out` because `data:build` wipes that directory.
 */
await copyFile(join(process.cwd(), 'data', 'survey.json'), join(to, 'survey.json'))

console.log('publish-data: data/out + data/survey.json → public/data')
