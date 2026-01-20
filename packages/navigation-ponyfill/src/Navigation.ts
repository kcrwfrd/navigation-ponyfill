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
  // @todo decide if we keep or remove hashchangeHandler
  #hashchangeHandler: ((event: HashChangeEvent) => void) | null = null

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
        // @todo native pushState does not add state to native navigation's history entry.
        // Consider omitting in our polyfill as well.
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
        // @todo native pushState does not add state to native navigation's history entry.
        // Consider omitting in our polyfill as well.
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
      this.#popstateHandler = (event: PopStateEvent) => {
        const previousEntry = self.#stack.currentEntry
        const meta = self.#history.state?.[Navigation.KEY]

        /**
         * There is no state... this was probably a hashchange
         *
         * A hashchange (e.g. from `<a href="#foo">` or `location.hash = 'foo'`)
         * will trigger a popstate event with a null state.
         *
         * @see https://html.spec.whatwg.org/multipage/browsing-the-web.html#navigate-non-frag-sync
         * > "this means that popstate events fire for fragment navigations, but not for history.pushState() calls."
         *
         * Unlike intercepting pushState and replaceState, the history entry
         * and state have already changed at this point. We will need to call
         * `replaceState` in order to keep our entries in sync.
         *
         * @note
         * It is important that we merge history.state with the previous state
         * at this point so that we don't cause Next.js to reload when it encounters
         * traversal to this history entry.
         *
         * @see https://github.com/vercel/next.js/blob/4fa7d80eb9183273cc531623bb45606942b438d6/packages/next/src/client/components/app-router.tsx#L364-L373
         */
        if (!event.state) {
          // Make sure the hashchange is added to our entries
          const id = generateId()
          const key = generateId()

          // We need to copy previous state or Next.js will reload
          // on navigation to this history entry
          const ogState = previousEntry?.getState() ?? {}

          const state = {
            ...ogState,
            [Navigation.KEY]: {
              entryId: id,
              entryKey: key,
            },
          }

          const url = resolveUrl()

          const newEntry = new NavigationHistoryEntry({
            id,
            index: self.#stack.currentIndex + 1,
            key,
            url,
            state: ogState,
            sameDocument: true,
          })

          // The history entry was never added to our stack so we need to do so now
          self.#stack.push(newEntry)

          // But the history entry was already created, so we need to replace it
          self.#replaceState(state, '', url)

          // And now we need to dispatch the event with navigationType: 'push'
          this.dispatchEvent(
            new NavigationCurrentEntryChangeEvent('currententrychange', {
              from: previousEntry!,
              navigationType: 'push',
            }),
          )

          return
        }

        if (!meta?.entryKey) {
          console.error(
            "navigation-ponyfill's state is corrupted: popstate event has state but no entryKey",
          )
          // Set currentIndex to -1 to indicate a corrupted state
          self.#stack.setCurrentIndex(-1)
          return
        }

        // Traverse to the entry with this key
        const targetEntry = self.#stack.traverseTo(meta.entryKey)

        if (!targetEntry) {
          /**
           * Entry not found in our stack - this could happen if:
           * - Popstate occurs before ponyfill initialized and rehydrates from sessionStorage
           * - Rehydration from sessionStorage failed
           * - History entry was created outside of navigation-ponyfill, perhaps before patching?
           * - ???
           *
           * @todo think through this edge case some more.
           */
          console.error(
            "navigation-ponyfill's state is corrupted: targetEntry not found on popstate",
            meta,
          )
          // Set currentIndex to -1 to indicate a corrupted state
          self.#stack.setCurrentIndex(-1)
          return
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
        // Entry found in rehydrated stack - set currentIndex to its position
        this.#stack.setCurrentIndex(existingEntry.index)
        return
      }

      /**
       * Entry not found - might have been truncated, fall through to create new
       *
       * @todo edge cases might lurk here.
       */
      console.warn(
        `entryId '${existingMeta.entryId}' found on history.state but entry not found in sessionStorage`,
      )
    }

    const entriesLength = this.#stack.entries().length

    // Fresh initialization or entry not found - create initial entry
    const id = generateId()
    const key = existingMeta?.entryKey ?? generateId()
    const entry = new NavigationHistoryEntry({
      id,
      index: entriesLength, // Append to end of any existing entries
      key,
      sameDocument: true,
      // @todo native pushState does not add state to native navigation's history entry.
      // Consider omitting in our polyfill as well.
      state: getUserState(this.#history.state),
      url: typeof window !== 'undefined' ? getCurrentUrl() : null,
    })
    // make sure push doesn't truncate our entries
    this.#stack.setCurrentIndex(entriesLength - 1)

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
   * Returns the current NavigationHistoryEntry, or null under certain special cases:
   * - the polyfill enters a corrupted state (e.g., if popstate event references
   *   an entry that doesn't exist in the stack)
   * - certain conditions under the spec
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigation/currentEntry
   * @see https://html.spec.whatwg.org/multipage/nav-history-apis.html#navigation-current-entry
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
    return (this.currentEntry?.index ?? 0) > 0
  }

  get canGoForward() {
    const currentIndex = this.currentEntry?.index ?? -1
    return currentIndex >= 0 && currentIndex < this.#stack.entries().length - 1
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

    // @todo decide if we keep or remove hashchangeHandler
    if (this.#hashchangeHandler) {
      window.removeEventListener('hashchange', this.#hashchangeHandler)
      this.#hashchangeHandler = null
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
