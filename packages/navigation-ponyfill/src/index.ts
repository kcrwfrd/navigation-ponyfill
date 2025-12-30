import { Navigation } from './Navigation'
import { HistoryShim } from './HistoryShim'

/**
 * Pre-initialized Navigation singleton.
 * Importing from 'navigation-ponyfill' auto-patches history.pushState/replaceState.
 *
 * For side-effect-free imports, use 'navigation-ponyfill/core' instead.
 *
 * @todo support deferral to native navigation instead.
 * We'll need to address TypeScript support.
 *
 * @example
 * import { navigation } from 'navigation-ponyfill'
 *
 * navigation.addEventListener('currententrychange', (event) => {
 *   console.log(event)
 * })
 */
export const navigation = new Navigation(
  typeof window !== 'undefined' ? window.history : new HistoryShim(),
)

export * from './core'
