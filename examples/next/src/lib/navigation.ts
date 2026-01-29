/**
 * Force the navigation polyfill for demonstration purposes.
 *
 * In a real-world application, you would typically just import from
 * 'navigation-ponyfill' directly, which will defer to the native
 * Navigation API when available:
 *
 * @example
 * import { navigation } from 'navigation-ponyfill'
 */
import { createNavigation, type Navigation } from 'navigation-ponyfill/core'

declare global {
  var __NAVIGATION_PONYFILL_INSTANCE__: Navigation | undefined
}

/**
 * In case module is re-evaluated during HMR
 */
if (globalThis.__NAVIGATION_PONYFILL_INSTANCE__) {
  console.log('__NAVIGATION_PONYFILL_INSTANCE__ already exists, destroying...')
  globalThis.__NAVIGATION_PONYFILL_INSTANCE__.destroy()
  globalThis.__NAVIGATION_PONYFILL_INSTANCE__ = undefined
}

globalThis.__NAVIGATION_PONYFILL_INSTANCE__ = createNavigation({
  force: true,
})

export const navigation = globalThis.__NAVIGATION_PONYFILL_INSTANCE__
