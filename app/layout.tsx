/**
 * The root layout deliberately renders nothing but its children: the document
 * shell lives in `app/[locale]/layout.tsx`, so that `lang` is the locale the
 * page is actually written in rather than a default applied to both.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
