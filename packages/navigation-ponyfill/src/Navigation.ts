import { NavigationCurrentEntryChangeEvent } from './NavigationCurrentEntryChangeEvent'
import { NavigationHistoryEntry } from './NavigationHistoryEntry'
import { NavigationHistoryEntriesStack } from './NavigationHistoryEntriesStack'
import { HistoryShim } from './HistoryShim'

/**
 * Navigation ponyfill
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigation
 */
export class Navigation extends EventTarget {
  static readonly KEY = '__NAVIGATION_PONYFILL'
  #history: History | HistoryShim
  #stack: NavigationHistoryEntriesStack

  #ogPushState: History['pushState']
  #ogReplaceState: History['replaceState']

  #pushState: History['pushState']
  #replaceState: History['replaceState']

  #popstateHandler: ((event: PopStateEvent) => void) | null = null

  constructor(history: History | HistoryShim) {
    super()

    this.#history = history
    this.#stack = new NavigationHistoryEntriesStack()
    this.#ogPushState = history.pushState
    this.#ogReplaceState = history.replaceState
    this.#pushState = history.pushState.bind(history)
    this.#replaceState = history.replaceState.bind(history)

    // Initialize the stack with the current entry
    this.#initializeCurrentEntry()

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

      const previousEntry = self.#stack.currentEntry
      const previousUrl = getCurrentUrl()

      const id = generateId()
      const key = generateId()

      const state = {
        ...(ogState ?? {}),
        [Navigation.KEY]: {
          canGoBack: true,
          previousUrl,
          entryId: id,
          entryKey: key,
        },
      }

      // Create and push new entry
      const newEntry = new NavigationHistoryEntry({
        id,
        key,
        url: resolveUrl(url),
        state: ogState,
        sameDocument: true,
        getIndex: () => self.#stack.getIndexById(id),
      })

      self.#stack.push(newEntry)

      self.#pushState(state, _unused, url)

      self.dispatchEvent(
        new NavigationCurrentEntryChangeEvent('currententrychange', {
          from: previousEntry!,
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

      const previousEntry = self.#stack.currentEntry
      const existingMeta = self.#history.state?.[Navigation.KEY]

      // Generate new id, but KEEP the same key
      const id = generateId()
      const key = existingMeta?.entryKey ?? generateId()

      const state = {
        ...(ogState ?? {}),
        [Navigation.KEY]: {
          canGoBack: existingMeta?.canGoBack ?? false,
          previousUrl: existingMeta?.previousUrl ?? null,
          entryId: id,
          entryKey: key,
        },
      }

      // Create replacement entry (same key, new id)
      const newEntry = new NavigationHistoryEntry({
        id,
        key,
        url: resolveUrl(url) ?? getCurrentUrl(),
        state: ogState,
        sameDocument: true,
        getIndex: () => self.#stack.getIndexById(id),
      })

      self.#stack.replace(newEntry)

      self.#replaceState(state, _unused, url)

      self.dispatchEvent(
        new NavigationCurrentEntryChangeEvent('currententrychange', {
          from: previousEntry!,
          navigationType: 'replace',
        }),
      )
    }

    if (typeof window !== 'undefined') {
      this.#popstateHandler = (_event: PopStateEvent) => {
        const previousEntry = self.#stack.currentEntry
        const meta = self.#history.state?.[Navigation.KEY]

        if (meta?.entryKey) {
          // Traverse to the entry with this key
          const targetEntry = self.#stack.traverseTo(meta.entryKey)

          if (!targetEntry) {
            /**
             * Entry not found in our stack - this could happen if:
             * - Popstate occurs before ponyfill initialized and rehydrates from sessionStorage
             * - History entry was created outside of navigation-ponyfill
             * - Popstate occurs from a hashchange
             * - ???
             *
             * @todo think through this edge case some more
             */
            console.warn(
              'targetEntry not found on popstate for navigation state:',
              meta,
            )

            // Create a new entry for this position
            const entryId = meta.entryId ?? generateId()
            const newEntry = new NavigationHistoryEntry({
              id: entryId,
              key: meta.entryKey,
              url: getCurrentUrl(),
              state: getUserState(self.#history.state),
              sameDocument: true,
              getIndex: () => self.#stack.getIndexById(entryId),
            })

            self.#stack.push(newEntry)
          }
        }

        this.dispatchEvent(
          new NavigationCurrentEntryChangeEvent('currententrychange', {
            from: previousEntry!,
            navigationType: 'traverse',
          }),
        )
      }
      window.addEventListener('popstate', this.#popstateHandler)
    }
  }

  /**
   * Initialize the entries stack with the current entry.
   */
  #initializeCurrentEntry(): void {
    const existingMeta = this.#history.state?.[Navigation.KEY]

    /**
     * @todo when NavigationHistoryEntriesStack rehydrates from sessionStorage
     * it will already create the current NavigationHistoryEntry if it already
     * has an entryKey.
     *
     * We'll only need to create the current entry if existingMeta doesn't exist.
     */
    if (existingMeta?.entryId) {
      // Rehydrating from existing state (e.g., page reload)
      const entryId = existingMeta.entryId
      const entry = new NavigationHistoryEntry({
        id: entryId,
        key: existingMeta.entryKey,
        url: typeof window !== 'undefined' ? getCurrentUrl() : null,
        state: getUserState(this.#history.state),
        sameDocument: true,
        getIndex: () => this.#stack.getIndexById(entryId),
      })
      this.#stack.push(entry)
    } else {
      // Fresh initialization - create initial entry
      const id = generateId()
      const key = generateId()
      const entry = new NavigationHistoryEntry({
        id,
        key,
        url: typeof window !== 'undefined' ? getCurrentUrl() : null,
        state: getUserState(this.#history.state),
        sameDocument: true,
        getIndex: () => this.#stack.getIndexById(id),
      })
      this.#stack.push(entry)

      // Persist to history state (only if we can)
      if (typeof window !== 'undefined') {
        this.#replaceState(
          {
            ...(this.#history.state ?? {}),
            [Navigation.KEY]: {
              ...this.#history.state?.[Navigation.KEY],
              entryId: id,
              entryKey: key,
            },
          },
          '',
        )
      }
    }
  }

  /**
   * Returns the current NavigationHistoryEntry.
   */
  get currentEntry(): NavigationHistoryEntry | null {
    return this.#stack.currentEntry
  }

  /**
   * Returns an array of all NavigationHistoryEntry objects.
   */
  entries(): NavigationHistoryEntry[] {
    return this.#stack.entries()
  }

  get canGoBack() {
    /**
     * @todo wonder if we should make this.#stack.entries public so we don't
     * need to create a new array every time we call canGoBack.
     */
    const entries = this.entries()
    const prevIndex = (this.currentEntry?.index ?? 0) - 1
    return entries[prevIndex] ? true : false
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
 * Generates a unique identifier for history entries.
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Resolves a URL to an absolute URL string.
 */
function resolveUrl(url?: string | URL | null): string {
  if (!url) return getCurrentUrl()
  if (typeof url === 'string') {
    return new URL(url, window.location.href).href
  }
  return url.href
}

/**
 * Extracts user state from history state by removing ponyfill metadata.
 */
function getUserState(state: any): unknown {
  if (!state) return undefined
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [Navigation.KEY]: _meta, ...userState } = state
  return Object.keys(userState).length > 0 ? userState : undefined
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
