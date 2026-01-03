import { Navigation } from './Navigation'
import { HistoryShim } from './HistoryShim'

type NativeNavigation = Window['navigation']

export function createNavigation(
  history: History | HistoryShim = typeof window !== 'undefined'
    ? window.history
    : new HistoryShim(),
): Navigation | NativeNavigation {
  if (typeof window !== 'undefined' && 'navigation' in window) {
    return window.navigation
  }
  return new Navigation(history)
}
