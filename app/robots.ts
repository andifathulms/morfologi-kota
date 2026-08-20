import type { MetadataRoute } from 'next'
import { absoluteUrl, siteUrl } from '@/lib/metadata'

/**
 * Crawlable, and pointed at the sitemap.
 *
 * Nothing here is disallowed: the derived database under `/data` is offered
 * under ODbL, so there is no reason to hide it from a crawler, and there are
 * no private routes to protect.
 */
export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    ...(siteUrl === undefined
      ? {}
      : { sitemap: absoluteUrl('/sitemap.xml') }),
  }
}
