'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * A navigation link that marks itself as the current page.
 *
 * The only client component in the product, and it exists for one reason: a
 * screen reader should be told which section it is in, and `aria-current` is
 * how that is said. It knows nothing about the data and holds no state.
 */
export function NavLink({ href, children }: { readonly href: string; readonly children: React.ReactNode }) {
  const pathname = usePathname()
  const current = pathname === href || pathname === `${href}/` || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      aria-current={current ? 'page' : undefined}
      className={current ? 'underline decoration-ink decoration-2 underline-offset-4' : undefined}
    >
      {children}
    </Link>
  )
}
