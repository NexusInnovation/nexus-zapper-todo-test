import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Watches the current URL and sets `document.title` automatically.
 *
 * - `/`           → "<appName>" (or "<appName> | <label>" if `navItems` contains a `'/'` entry)
 * - `/<segment>`  → "<appName> | <navigation label>"
 *
 * Unknown segments (no matching route) fall back to "<appName>" only.
 *
 * Call once inside the root layout component (e.g. AppShell). Do not call in individual pages.
 *
 * @param translatedAppName - The already-translated application name displayed in the browser tab.
 * @param navItems - Array of `{ route, translatedLabel }` pairs to match against the first URL segment.
 *   Only the first segment of `route` is used for matching, so `/orders`, `/orders/history`, and
 *   `/orders/:id` all match the segment `'orders'`. Include a `{ route: '/', translatedLabel }` entry
 *   to override the title on the root path.
 */
export const useRoutePageTitle = (
  translatedAppName: string,
  navItems: { route: string; translatedLabel: string }[],
) => {
  const { pathname } = useLocation()

  useEffect(() => {
    const firstSegment = (path: string) =>
      path.split('/').filter(Boolean)[0] ?? ''
    const segment = firstSegment(pathname)
    const match = navItems.find(({ route }) => firstSegment(route) === segment)
    const label = match?.translatedLabel ?? ''

    document.title = label
      ? `${translatedAppName} | ${label}`
      : translatedAppName
  }, [pathname, translatedAppName, navItems])
}
