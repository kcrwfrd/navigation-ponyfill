import { createNavigation } from './createNavigation'

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
export const navigation = createNavigation()

export * from './core'
