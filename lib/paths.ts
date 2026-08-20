/**
 * Paths to files in the export.
 *
 * `next/link` and `next/image` apply the basePath themselves; a plain `href`
 * to a static file does not, and forgetting it is the classic GitHub Pages
 * break — everything works locally and 404s in production.
 */

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export function assetPath(path: string): string {
  return `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`
}

/** The derived database for one site, offered under ODbL. */
export function siteDataPath(slug: string): string {
  return assetPath(`/data/${slug}.json`)
}

export function manifestDataPath(): string {
  return assetPath('/data/manifest.json')
}
