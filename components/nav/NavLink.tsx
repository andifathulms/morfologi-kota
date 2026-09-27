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
export function NavLink({
  href,
  children,
  also = [],
  exact = false,
  className,
}: {
  readonly href: string
  readonly children: React.ReactNode
  /** Other sections this link stands for — Asumsi is a tab of Metode. */
  readonly also?: readonly string[]
  /** Current only on this exact page, not on the pages beneath it. */
  readonly exact?: boolean
  readonly className?: string
}) {
  const pathname = usePathname()
  const matches = (target: string) =>
    pathname === target ||
    pathname === `${target}/` ||
    (!exact && pathname.startsWith(`${target}/`))
  const current = matches(href) || also.some(matches)

  return (
    <Link
      href={href}
      aria-current={current ? 'page' : undefined}
      className={[className, current ? 'nav-current' : undefined].filter(Boolean).join(' ') || undefined}
    >
      {children}
    </Link>
  )
}
