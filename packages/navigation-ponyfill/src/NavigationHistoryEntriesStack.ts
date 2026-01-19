import { NavigationHistoryEntry } from './NavigationHistoryEntry'

const STORAGE_KEY = '__NAVIGATION_PONYFILL_ENTRIES'

/**
 * Manages the stack of NavigationHistoryEntry objects.
 * Handles push, replace, and traverse operations while maintaining
 * the current position in the stack.
 *
 * Entries are persisted to sessionStorage so they survive page reloads.
 *
 * @todo
 * The entries array grows unbounded. Navigation-heavy SPAs could eventually
 * exceed sessionStorage limits (typically 5-10MB), causing failures.
 *
 * Consider implementing a maximum entry count (e.g., 50 entries) with LRU eviction.
 * Note: doing so would present challenges for `index` property on entries.
 *
 * @see https://github.com/whatwg/html/issues/8620
 */
export class NavigationHistoryEntriesStack {
  #entries: NavigationHistoryEntry[] = []
  #currentIndex: number = -1

  constructor() {
    this.#load()
  }

  /**
   * Returns the current entry, or null if stack is empty.
   */
  get currentEntry(): NavigationHistoryEntry | null {
    if (this.#currentIndex < 0 || this.#currentIndex >= this.#entries.length) {
      return null
    }
    return this.#entries[this.#currentIndex]
  }

  /**
   * Returns the current index position in the stack.
   */
  get currentIndex(): number {
    return this.#currentIndex
  }

  /**
   * Returns a shallow copy of all entries.
   */
  entries(): NavigationHistoryEntry[] {
    return [...this.#entries]
  }

  /**
   * Push a new entry, truncating any forward history.
   * Disposes removed entries.
   */
  push(entry: NavigationHistoryEntry): void {
    // Truncate forward history and dispose removed entries
    const removedEntries = this.#entries.splice(this.#currentIndex + 1)
    for (const removed of removedEntries) {
      removed._setDisposed()
    }

    this.#entries.push(entry)
    this.#currentIndex = this.#entries.length - 1
    this.#save()
  }

  /**
   * Replace the current entry with a new one.
   * Disposes the old entry.
   */
  replace(entry: NavigationHistoryEntry): void {
    if (this.#currentIndex >= 0 && this.#currentIndex < this.#entries.length) {
      const oldEntry = this.#entries[this.#currentIndex]
      oldEntry._setDisposed()
      this.#entries[this.#currentIndex] = entry
      this.#save()
    } else {
      // If stack is empty, treat replace as push
      this.push(entry)
    }
  }

  /**
   * Traverse to an entry identified by its key.
   * Returns the entry if found, or null if not found.
   */
  traverseTo(key: string): NavigationHistoryEntry | null {
    const index = this.getIndexByKey(key)
    if (index === -1) {
      return null
    }
    this.#currentIndex = index
    return this.#entries[index]
  }

  /**
   * Find an entry by key.
   */
  findByKey(key: string): NavigationHistoryEntry | null {
    return this.#entries.find((entry) => entry.key === key) ?? null
  }

  /**
   * Get the index of an entry by key. Returns -1 if not found.
   */
  getIndexByKey(key: string): number {
    return this.#entries.findIndex((entry) => entry.key === key)
  }

  /**
   * Get the index of an entry by id. Returns -1 if not found.
   */
  getIndexById(id: string): number {
    return this.#entries.findIndex((entry) => entry.id === id)
  }

  /**
   * Find an entry by id.
   */
  findById(id: string): NavigationHistoryEntry | null {
    return this.#entries.find((entry) => entry.id === id) ?? null
  }

  /**
   * Set the current index. Called by Navigation after loading to sync
   * with the current history.state entry.
   */
  setCurrentIndex(index: number): void {
    this.#currentIndex = index
  }

  /**
   * Save entries to sessionStorage.
   */
  #save(): void {
    if (typeof sessionStorage === 'undefined') {
      console.warn(
        'NavigationHistoryEntriesStack: sessionStorage is undefined, skipping save to sessionStorage',
      )
      return
    }

    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          entries: this.#entries,
        }),
      )
    } catch (error) {
      console.error(
        `Failed to save navigation-ponyfill entries to sessionStorage with storage key: '${STORAGE_KEY}'`,
      )
      console.error(error)
    }
  }

  /**
   * Load entries from sessionStorage.
   */
  #load(): void {
    if (typeof sessionStorage === 'undefined') {
      console.warn(
        'NavigationHistoryEntriesStack: sessionStorage is undefined, skipping load from sessionStorage',
      )
      return
    }

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (!stored) return

      const { entries = [] } = JSON.parse(stored)

      // @todo consider validating entries before instantiation
      this.#entries = entries.map(
        (
          data: {
            id: string
            key: string
            url: string | null
            index: number
            state?: unknown
            sameDocument?: boolean
          },
          index: number,
        ) => {
          if (data.index !== index) {
            console.warn(
              `NavigationHistoryEntry index mismatch: ${data.index} !== ${index} for entry id '${data.id}'`,
            )
          }

          return new NavigationHistoryEntry({
            id: data.id,
            key: data.key,
            url: data.url,
            index: index,
            state: data.state,
            sameDocument: data.sameDocument,
          })
        },
      )
      // currentIndex is NOT loaded - Navigation will set it based on history.state
      this.#currentIndex = -1
    } catch (error) {
      console.error(
        `Failed to load navigation-ponyfill entries from sessionStorage with storage key: '${STORAGE_KEY}'`,
      )
      console.error(error)
    }
  }

  /**
   * Clear persisted data from sessionStorage.
   */
  static clearStorage(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }
}
