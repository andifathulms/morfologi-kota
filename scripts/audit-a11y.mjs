/**
 * Static accessibility audit of the exported HTML.
 *
 * **This is not a screen-reader test.** It cannot tell you whether a page
 * makes sense when heard, only whether the structures a reader depends on are
 * present and well formed. A human pass with VoiceOver or NVDA is still owed
 * and is recorded as outstanding in CLAUDE.md.
 *
 * What it does check is the set of failures that are invisible on screen and
 * fatal in a reader: a missing document language, a skipped heading level, an
 * unlabelled control or figure, a table without a caption, a link with no text,
 * a duplicate id, a positive tabindex.
 *
 *   pnpm audit:a11y        # after pnpm build
 */

import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const OUT = join(process.cwd(), 'out')

async function htmlFiles(dir) {
  const found = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === '_next') continue
      found.push(...(await htmlFiles(full)))
    } else if (entry.name.endsWith('.html')) {
      found.push(full)
    }
  }
  return found
}

/** Text content of a fragment, with tags and comments removed. */
function textOf(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z]+;/gi, ' ')
    .trim()
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'))
  return match?.[1]
}

const failures = []
const notes = []

function check(condition, page, message) {
  if (!condition) failures.push(`${page}: ${message}`)
}

async function auditPage(file) {
  const page = relative(OUT, file)
  const html = await readFile(file, 'utf8')
  // The RSC payload repeats the markup in escaped form; audit the document
  // only, or every finding would be counted twice.
  const document = html.split('<script>self.__next_f')[0] ?? html

  const lang = attribute(document.match(/<html[^>]*>/)?.[0] ?? '', 'lang')
  check(lang !== undefined && lang.length > 0, page, 'the html element has no lang')

  const title = textOf(document.match(/<title>[\s\S]*?<\/title>/)?.[0] ?? '')
  check(title.length > 0, page, 'the document has no title')

  const headings = [...document.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g)].map((match) => ({
    level: Number(match[1]),
    text: textOf(match[2] ?? ''),
  }))
  const h1s = headings.filter((heading) => heading.level === 1)
  check(h1s.length === 1, page, `expected exactly one h1, found ${h1s.length}`)
  for (const heading of headings) {
    check(heading.text.length > 0, page, `an h${heading.level} is empty`)
  }
  let previous = 0
  for (const heading of headings) {
    if (previous > 0 && heading.level > previous + 1) {
      failures.push(
        `${page}: heading level jumps from h${previous} to h${heading.level} at “${heading.text.slice(0, 40)}”`,
      )
    }
    previous = heading.level
  }

  const mains = document.match(/<main[\s>]/g) ?? []
  check(mains.length === 1, page, `expected exactly one main landmark, found ${mains.length}`)

  // The skip link must point at something that exists.
  for (const anchor of document.matchAll(/<a[^>]*href="#([^"]+)"/g)) {
    const id = anchor[1]
    check(document.includes(`id="${id}"`), page, `skip target #${id} does not exist`)
  }

  for (const image of document.matchAll(/<img[^>]*>/g)) {
    check(attribute(image[0], 'alt') !== undefined, page, 'an img has no alt attribute')
  }

  for (const svg of document.matchAll(/<svg[^>]*>/g)) {
    const role = attribute(svg[0], 'role')
    if (role === 'img') {
      const label = attribute(svg[0], 'aria-label')
      check(
        label !== undefined && label.length > 0,
        page,
        'an svg with role="img" has no aria-label',
      )
    }
  }

  for (const link of document.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)) {
    const text = textOf(link[1] ?? '')
    const label = attribute(link[0], 'aria-label')
    check(text.length > 0 || (label ?? '').length > 0, page, 'a link has no accessible text')
  }

  for (const control of document.matchAll(/<(input|select|textarea)\b[^>]*>/g)) {
    const tag = control[0]
    const type = attribute(tag, 'type')
    if (type === 'hidden') continue
    const id = attribute(tag, 'id')
    const label = attribute(tag, 'aria-label')
    const labelled =
      (label ?? '').length > 0 || (id !== undefined && document.includes(`for="${id}"`))
    check(labelled, page, `a ${control[1]} control has no label (id=${id ?? 'none'})`)
  }

  for (const table of document.matchAll(/<table\b[\s\S]*?<\/table>/g)) {
    check(table[0].includes('<caption'), page, 'a table has no caption')
    const headerCells = table[0].match(/<th\b[^>]*>/g) ?? []
    check(headerCells.length > 0, page, 'a table has no header cells')
  }

  for (const fieldset of document.matchAll(/<fieldset\b[\s\S]*?<\/fieldset>/g)) {
    check(fieldset[0].includes('<legend'), page, 'a fieldset has no legend')
  }

  for (const element of document.matchAll(/\stabindex="(\d+)"/g)) {
    check(Number(element[1]) <= 0, page, `a positive tabindex (${element[1]}) breaks focus order`)
  }

  const ids = [...document.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])
  const seen = new Set()
  for (const id of ids) {
    if (seen.has(id)) failures.push(`${page}: duplicate id "${id}"`)
    seen.add(id)
  }

  for (const details of document.matchAll(/<details\b[\s\S]*?<\/details>/g)) {
    check(details[0].includes('<summary'), page, 'a details element has no summary')
  }

  return { page, headings: headings.length, tables: (document.match(/<table\b/g) ?? []).length }
}

const files = await htmlFiles(OUT)
if (files.length === 0) {
  console.error('No HTML in out/. Run `pnpm build` first.')
  process.exit(1)
}

const summaries = []
for (const file of files) summaries.push(await auditPage(file))

console.log(`Audited ${files.length} exported pages.`)
console.log(
  `${summaries.reduce((sum, s) => sum + s.headings, 0)} headings, ` +
    `${summaries.reduce((sum, s) => sum + s.tables, 0)} tables.`,
)
for (const note of notes) console.log(`  · ${note}`)

if (failures.length > 0) {
  console.error(`\n${failures.length} finding(s):`)
  for (const failure of failures) console.error(`  ✗ ${failure}`)
  process.exit(1)
}

console.log('\nNo structural findings.')
console.log('This is not a screen-reader test. A human pass with a reader is still owed.')
