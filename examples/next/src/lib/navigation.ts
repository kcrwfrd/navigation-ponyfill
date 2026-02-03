/**
 * Navigation ponyfill setup with environment-based configuration.
 *
 * Set NEXT_PUBLIC_FORCE_PONYFILL=true to force the ponyfill even when
 * the native Navigation API is available (useful for e2e testing).
 *
 * In a real-world application, you would typically just import from
 * 'navigation-ponyfill' directly, which will defer to the native
 * Navigation API when available:
 *
 * @example
 * import { navigation } from 'navigation-ponyfill'
 */
import { createNavigation } from 'navigation-ponyfill/core'

declare global {
  var __NAVIGATION_PONYFILL_INSTANCE__:
    | ReturnType<typeof createNavigation>
    | undefined
}

/**
 * In case module is re-evaluated during HMR
 */
if (
  globalThis.__NAVIGATION_PONYFILL_INSTANCE__ &&
  'destroy' in globalThis.__NAVIGATION_PONYFILL_INSTANCE__
) {
  console.log('__NAVIGATION_PONYFILL_INSTANCE__ already exists, destroying...')
  globalThis.__NAVIGATION_PONYFILL_INSTANCE__.destroy()
  globalThis.__NAVIGATION_PONYFILL_INSTANCE__ = undefined
}

const forcePonyfill = process.env.NEXT_PUBLIC_FORCE_PONYFILL === 'true'

export const navigation = createNavigation({
  force: forcePonyfill,
})

globalThis.__NAVIGATION_PONYFILL_INSTANCE__ = navigation

if (typeof window !== 'undefined') {
  console.log('forced ponyfill:', forcePonyfill)
  console.log('navigation deferred:', navigation === window.navigation)
  console.log('navigation instance:', navigation)
}

export * from 'navigation-ponyfill/core'
