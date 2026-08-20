import type { MetadataRoute } from 'next'
import { SITES } from '@/data/sites'
import { LOCALES } from '@/lib/i18n'
import { absoluteUrl, routePath, siteUrl } from '@/lib/metadata'

/**
 * The sitemap, enumerated from the same constants the routes are generated
 * from — `LOCALES` and `SITES` — so it cannot list a page that does not exist
 * or miss one that does.
 *
 * It exists because the root of this deploy is a `noindex` hand-off page: a
 * crawler arriving at the repository root finds a meta refresh and two links,
 * and nothing telling it that forty pages live under it in two languages.
 *
 * Emitted only with an absolute origin. A sitemap of relative URLs is not a
 * valid sitemap, and an invalid one is worse than none — `NEXT_PUBLIC_SITE_URL`
 * is set by the deploy workflow.
 */
export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  if (siteUrl === undefined) return []

  const paths = LOCALES.flatMap((locale) => [
    routePath(locale, 'lempeng'),
    routePath(locale, 'asumsi'),
    routePath(locale, 'metode'),
    ...SITES.map((site) => routePath(locale, `lokasi/${site.slug}`)),
  ])

  return paths.map((path) => ({
    url: absoluteUrl(path) ?? path,
    // The plate is the entry point; a site page is a leaf of it.
    priority: path.endsWith('/lempeng/') ? 1 : 0.7,
  }))
}
