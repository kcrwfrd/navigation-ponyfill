import { NavigationCurrentEntryChangeEvent } from './NavigationCurrentEntryChangeEvent'
import { NavigationHistoryEntry } from './NavigationHistoryEntry'
import { HistoryShim } from './HistoryShim'

/**
 * Navigation ponyfill
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigation
 */
export class Navigation extends EventTarget {
  static readonly KEY = '__NAVIGATION_PONYFILL'
  #history: History | HistoryShim

  constructor(history: History | HistoryShim) {
    super()

    this.#history = history

    const ogPushState = history.pushState.bind(history)
    const ogReplaceState = history.replaceState.bind(history)

    const self = this

    /**
     * Check out Next.js's monkey-patch of History for some prior art:
     * @see https://github.com/vercel/next.js/blob/4fa7d80eb9183273cc531623bb45606942b438d6/packages/next/src/client/components/app-router.tsx#L91
     */
    history.pushState = function pushState(
      ogState: any,
      _unused: string,
      url?: string | URL | null,
    ) {
      const previousPath = getCurrentUrl()

      const state = {
        ...(ogState || {}),
        [Navigation.KEY]: {
          canGoBack: true,
          previousPath,
        },
      }

      // @todo use this.currentEntry instead of instantiating here
      const currentEntry = new NavigationHistoryEntry(previousPath)

      ogPushState(state, _unused, url)

      self.dispatchEvent(
        new NavigationCurrentEntryChangeEvent('currententrychange', {
          from: currentEntry,
          navigationType: 'push',
        }),
      )
    }

    history.replaceState = function replaceState(
      ogState: any,
      _unused: string,
      url?: string | URL | null,
    ) {
      const state = {
        ...(ogState || {}),
        [Navigation.KEY]: {
          canGoBack: self.#history.state?.[Navigation.KEY]?.canGoBack ?? false,
          previousPath:
            self.#history.state?.[Navigation.KEY]?.previousPath ?? null,
        },
      }

      // @todo perhaps we can retrieve this entry from the entries() array instaed of instantiating here?
      const currentEntry = new NavigationHistoryEntry(getCurrentUrl())

      ogReplaceState(state, _unused, url)

      self.dispatchEvent(
        new NavigationCurrentEntryChangeEvent('currententrychange', {
          from: currentEntry,
          navigationType: 'replace',
        }),
      )
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', (event) => {
        self.dispatchEvent(
          new NavigationCurrentEntryChangeEvent('currententrychange', {
            // @todo how can we determine the prior entry at this time?
            from: new NavigationHistoryEntry(null),
            navigationType: 'traverse',
          }),
        )
      })
    }
  }

  get canGoBack() {
    return this.#history.state?.[Navigation.KEY]?.canGoBack ?? false
  }
}

function getCurrentUrl() {
  if (typeof window === 'undefined') {
    throw new Error('getCurrentUrl can only be called in the browser')
  }

  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}
