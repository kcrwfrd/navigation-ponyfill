import { Navigation } from './Navigation'
import { HistoryShim } from './HistoryShim'

export function createNavigation(
  history: History | HistoryShim = typeof window !== 'undefined'
    ? window.history
    : new HistoryShim(),
) {
  return new Navigation(history)
}
