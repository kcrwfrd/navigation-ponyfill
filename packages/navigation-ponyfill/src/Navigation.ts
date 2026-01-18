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
  /**
   * @todo
   * We can remove public access to this now that entries() / currentEntry are supported.
   * Apps can use those APIs to grab the previous URL in a way that's compatible
   * with native Navigation API instead of looking at history.state directly.
   * @deprecated
   */
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

      const id = generateId()
      const key = generateId()

      const state = {
        ...(ogState ?? {}),
        [Navigation.KEY]: {
          entryId: id,
          entryKey: key,
        },
      }

      // Create and push new entry
      const newEntry = new NavigationHistoryEntry({
        id,
        index: self.#stack.currentIndex + 1,
        key,
        url: resolveUrl(url),
        state: ogState,
        sameDocument: true,
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
          entryId: id,
          entryKey: key,
        },
      }

      // Create replacement entry (same key, new id)
      const newEntry = new NavigationHistoryEntry({
        id,
        index: self.#stack.currentIndex,
        key,
        url: resolveUrl(url) ?? getCurrentUrl(),
        state: ogState,
        sameDocument: true,
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
             * - History entry was created outside of navigation-ponyfill, perhaps before patching?
             * - ???
             *
             * @todo think through this edge case some more.
             */
            console.error(
              'targetEntry not found on popstate for navigation state:',
              meta,
              'navigation-ponyfill is in an irrecoverable state.'
            )

            // Set currentIndex to -1 to indicate an irrecoverable state
            self.#stack.setCurrentIndex(-1)
          }
        } else {
          /**
           * @todo
           * Handle if no history.state or no entryKey is found in history.state.
           * This is probably due to a hashchange.
           */
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
   *
   * If the stack has rehydrated entries from sessionStorage and we can find
   * the current entry by id from history.state, we'll use that entry.
   * Otherwise, we create a fresh entry.
   */
  #initializeCurrentEntry(): void {
    const existingMeta = this.#history.state?.[Navigation.KEY]

    // Check if stack has rehydrated entries and we can find the current one
    if (existingMeta?.entryId && this.#stack.entries().length > 0) {
      const existingEntry = this.#stack.findById(existingMeta.entryId)
      if (existingEntry) {
        /**
         * Entry found in rehydrated stack - set currentIndex to its position
         *
         * @todo consider that if existingEntry.index does not match its actual
         * position in the stack, we're in a corrupted state.
         * Should we handle and recover from this?
         */
        this.#stack.setCurrentIndex(existingEntry.index)
        return
      }
      // Entry not found - might have been truncated, fall through to create new
    }

    // Fresh initialization or entry not found - create initial entry
    const id = generateId()
    const key = existingMeta?.entryKey ?? generateId()
    const entry = new NavigationHistoryEntry({
      id,
      index: this.#stack.entries().length, // Append to end of any existing entries
      key,
      sameDocument: true,
      state: getUserState(this.#history.state),
      url: typeof window !== 'undefined' ? getCurrentUrl() : null,
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

  /**
   * Returns the current NavigationHistoryEntry.
   *
   * Note: we assert to simplify types for consumers.
   * Once constructor has completed it should be reliably non-null.
   *
   * In library code, consider treating as possibly null.
   */
  get currentEntry(): NavigationHistoryEntry {
    return this.#stack.currentEntry!
  }

  /**
   * Returns an array of all NavigationHistoryEntry objects.
   */
  entries(): NavigationHistoryEntry[] {
    return this.#stack.entries()
  }

  get canGoBack() {
    return (this.currentEntry?.index ?? 0) > 0
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
