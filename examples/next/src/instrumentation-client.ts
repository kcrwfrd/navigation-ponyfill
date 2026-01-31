/**
 * In a real-world application, you would typically just import from
 * 'navigation-ponyfill' directly, which will defer to the native
 * Navigation API when available:
 *
 * @example
 * import { navigation } from 'navigation-ponyfill'
 */
import { navigation } from './lib/navigation'

// Expose on window.nav for debugging
;(window as Window & { nav?: typeof navigation }).nav = navigation
