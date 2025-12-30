import { Navigation } from './Navigation'
import { HistoryShim } from './HistoryShim'

/**
 * @todo support deferral to native navigation instead.
 * We'll need to address TypeScript support.
 */
export const navigation = new Navigation(
  typeof window !== 'undefined' ? window.history : new HistoryShim(),
)

export { Navigation }
export { NavigationCurrentEntryChangeEvent } from './NavigationCurrentEntryChangeEvent'
export { NavigationHistoryEntry } from './NavigationHistoryEntry'
export type { NavigationType } from './NavigationType'
