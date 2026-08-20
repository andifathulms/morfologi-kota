/**
 * One source for a route's URLs.
 *
 * The layout declared `alternates.languages` and every page then declared
 * `alternates.canonical` — and Next merges metadata one key deep, so the
 * page's `alternates` replaced the layout's wholesale. The result: hreflang on
 * the thirty-two site pages, which happen not to set `alternates`, and on none
 * of the other six. Nobody would notice until a search engine did.
 *
 * A route states its path once, here, and gets its canonical, its hreflang
 * pair and its og:url from that one string — rather than each page restating
 * a URL that can drift from the one the layout believes in.
 */

import type { Metadata } from 'next'
import { LOCALES, type Locale } from '@/lib/i18n'

/**
 * The deploy origin. Absolute metadata is only emitted when it is set: a
 * guessed origin produces canonical links pointing at a site that does not
 * exist, which is worse than having none.
 */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

/**
 * The deploy sits under a repository name, so every absolute URL needs it.
 *
 * `new URL('/id/lempeng/', 'https://host/morfologi-kota')` resolves to
 * `https://host/id/lempeng/` — a leading slash resets to the origin and the
 * base path is silently dropped. Next applies `basePath` itself when it
 * resolves metadata against `metadataBase`, so canonical and hreflang are
 * fine; anything built with a bare `new URL` here is not, which is how the
 * first version of the sitemap came out pointing at pages that do not exist.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/** An absolute URL for a path within the deploy, base path included exactly once. */
export function absoluteUrl(path: string): string | undefined {
  if (siteUrl === undefined) return undefined
  const origin = new URL(siteUrl).origin
  const withBase = `${basePath}${path}`.replace(/\/+/g, '/')
  return new URL(withBase, origin).toString()
}

/** The path of a route within a locale, e.g. `lempeng` or `lokasi/menteng`. */
export function routePath(locale: Locale, path: string): string {
  return `/${locale}/${path}/`.replace(/\/+/g, '/')
}

/**
 * Canonical plus both hreflang alternates for one route.
 *
 * Spread into a page's `generateMetadata` so the page never writes
 * `alternates` by hand and cannot drop the languages by declaring a canonical.
 */
export function alternatesFor(locale: Locale, path: string): Metadata['alternates'] {
  const languages: Record<string, string> = {}
  for (const other of LOCALES) languages[other] = routePath(other, path)
  return { canonical: routePath(locale, path), languages }
}

/** `og:url` from the same string the canonical came from. */
export function openGraphUrl(locale: Locale, path: string): string | undefined {
  return absoluteUrl(routePath(locale, path))
}
