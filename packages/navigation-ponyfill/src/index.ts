import { createNavigation } from './createNavigation'

/**
 * This is simply a reference to `window.navigation` when available.
 *
 * When not available, it is a singleton instance of our `Navigation` polyfill.
 * In this case, importing from 'navigation-ponyfill' auto-patches history.pushState/replaceState.
 *
 * For side-effect-free imports, use 'navigation-ponyfill/core' instead.
 *
 * @example
 * import { navigation } from 'navigation-ponyfill'
 *
 * navigation.addEventListener('currententrychange', (event) => {
 *   console.log(event)
 * })
 */
export const navigation = createNavigation()

export * from './core'
