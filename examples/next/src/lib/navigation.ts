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
import { createNavigation } from 'navigation-ponyfill/core'

export const navigation = createNavigation({ force: true })
