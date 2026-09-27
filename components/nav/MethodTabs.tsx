import { NavLink } from '@/components/nav/NavLink'
import type { Locale } from '@/lib/i18n'

/**
 * Metode's two tabs: the method, and the assumptions it rests on.
 *
 * Asumsi used to be a top-level section beside the plate, which made the tag
 * mapping look like a destination rather than a condition on every number.
 * It is now a tab of the method — and the mapping itself is a chip in the
 * masthead on every page, so the choice is more visible than it was, not
 * less (CLAUDE.md, Invariants §3). The URL `/asumsi` is unchanged.
 *
 * On the method page the tabs are followed by its own contents, because the
 * plate's toolbar links into the middle of it (`#cara-membaca`).
 */
export function MethodTabs({
  locale,
  contents,
}: {
  readonly locale: Locale
  /** In-page anchors, where the page has sections worth jumping to. */
  readonly contents?: readonly { readonly id: string; readonly label: string }[]
}) {
  return (
    <div className="mt-6 border-b border-rule-strong">
      <nav aria-label={locale === 'id' ? 'Bagian metode' : 'Method sections'} className="flex gap-1 font-sans text-base">
        <NavLink href={`/${locale}/metode`} exact className="nav-item">
          {locale === 'id' ? 'Metode' : 'Method'}
        </NavLink>
        <NavLink href={`/${locale}/asumsi`} exact className="nav-item">
          {locale === 'id' ? 'Asumsi & sensitivitas' : 'Assumptions & sensitivity'}
        </NavLink>
      </nav>
      {contents === undefined || contents.length === 0 ? null : (
        <nav
          aria-label={locale === 'id' ? 'Isi halaman' : 'On this page'}
          className="flex flex-wrap gap-x-6 gap-y-1 border-t border-rule-faint py-3 font-sans text-xs"
        >
          {contents.map((item) => (
            <a key={item.id} href={`#${item.id}`} className="text-ink-muted">
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </div>
  )
}
