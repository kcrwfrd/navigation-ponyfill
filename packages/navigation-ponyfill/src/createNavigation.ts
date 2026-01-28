import { Navigation } from './Navigation'
import { HistoryShim } from './HistoryShim'

type NativeNavigation = Window['navigation']

type CreateNavigationOptions = {
  force?: boolean
  history?: History | HistoryShim
}

// Overload: force: true → always returns polyfill
export function createNavigation(options: {
  force: true
  history?: History | HistoryShim
}): Navigation

// Overload: default → may return native or polyfill
export function createNavigation(
  options?: CreateNavigationOptions,
): Navigation | NativeNavigation

// Implementation
export function createNavigation(
  options: CreateNavigationOptions = {},
): Navigation | NativeNavigation {
  const {
    force = false,
    history = typeof window !== 'undefined'
      ? window.history
      : new HistoryShim(),
  } = options

  if (!force && typeof window !== 'undefined' && 'navigation' in window) {
    return window.navigation
  }
  return new Navigation(history)
}
