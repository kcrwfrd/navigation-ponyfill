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

  #ogPushState: History['pushState']
  #ogReplaceState: History['replaceState']

  #pushState: History['pushState']
  #replaceState: History['replaceState']

  #popstateHandler: ((event: PopStateEvent) => void) | null = null

  constructor(history: History | HistoryShim) {
    super()

    this.#history = history
    this.#ogPushState = history.pushState
    this.#ogReplaceState = history.replaceState
    this.#pushState = history.pushState.bind(history)
    this.#replaceState = history.replaceState.bind(history)

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
      assertStateIsObjectOrNullish(ogState)

      const previousUrl = getCurrentUrl()

      const state = {
        ...(ogState ?? {}),
        [Navigation.KEY]: {
          canGoBack: true,
          previousUrl,
        },
      }

      // @todo use this.currentEntry instead of instantiating here
      const currentEntry = new NavigationHistoryEntry(previousUrl)

      self.#pushState(state, _unused, url)

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
      assertStateIsObjectOrNullish(ogState)

      const state = {
        ...(ogState ?? {}),
        [Navigation.KEY]: {
          canGoBack: self.#history.state?.[Navigation.KEY]?.canGoBack ?? false,
          previousUrl:
            self.#history.state?.[Navigation.KEY]?.previousUrl ?? null,
        },
      }

      // @todo perhaps we can retrieve this entry from the entries() array instead of instantiating here?
      const currentEntry = new NavigationHistoryEntry(getCurrentUrl())

      self.#replaceState(state, _unused, url)

      self.dispatchEvent(
        new NavigationCurrentEntryChangeEvent('currententrychange', {
          from: currentEntry,
          navigationType: 'replace',
        }),
      )
    }

    if (typeof window !== 'undefined') {
      this.#popstateHandler = (_event: PopStateEvent) => {
        this.dispatchEvent(
          new NavigationCurrentEntryChangeEvent('currententrychange', {
            // @todo how can we determine the prior entry at this time?
            from: new NavigationHistoryEntry(null),
            navigationType: 'traverse',
          }),
        )
      }
      window.addEventListener('popstate', this.#popstateHandler)
    }
  }

  get canGoBack() {
    return this.#history.state?.[Navigation.KEY]?.canGoBack ?? false
  }

  /**
   * Restores the original history methods and removes event listeners.
   * Useful for testing or when the ponyfill is no longer needed.
   */
  destroy() {
    this.#history.pushState = this.#ogPushState
    this.#history.replaceState = this.#ogReplaceState

    if (this.#popstateHandler) {
      window.removeEventListener('popstate', this.#popstateHandler)
      this.#popstateHandler = null
    }
  }
}

export function getCurrentUrl() {
  if (typeof window === 'undefined') {
    throw new Error('getCurrentUrl can only be called in the browser')
  }

  return window.location.href
}

/**
 * We cannot properly merge state with navigation-ponyfill's state
 * if it's not an object (e.g. boolean, number, string, etc.)
 */
function assertStateIsObjectOrNullish(state: unknown): void {
  if (state != null && (typeof state !== 'object' || Array.isArray(state))) {
    throw new TypeError(
      `history state must be a non-array object or nullish, received ${Array.isArray(state) ? 'array' : typeof state}`,
    )
  }
}
