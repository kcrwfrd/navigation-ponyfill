import { NavigationHistoryEntry } from './NavigationHistoryEntry'

/**
 * Manages the stack of NavigationHistoryEntry objects.
 * Handles push, replace, and traverse operations while maintaining
 * the current position in the stack.
 */
export class NavigationHistoryEntriesStack {
  #entries: NavigationHistoryEntry[] = []
  #currentIndex: number = -1

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
   * Dispatches 'dispose' event on removed entries.
   */
  push(entry: NavigationHistoryEntry): void {
    // Truncate forward history and dispatch dispose on removed entries
    const removedEntries = this.#entries.splice(this.#currentIndex + 1)
    for (const removed of removedEntries) {
      removed.dispatchEvent(new Event('dispose'))
    }

    this.#entries.push(entry)
    this.#currentIndex = this.#entries.length - 1
  }

  /**
   * Replace the current entry with a new one.
   * Dispatches 'dispose' event on the old entry.
   */
  replace(entry: NavigationHistoryEntry): void {
    if (this.#currentIndex >= 0 && this.#currentIndex < this.#entries.length) {
      const oldEntry = this.#entries[this.#currentIndex]
      oldEntry.dispatchEvent(new Event('dispose'))
      this.#entries[this.#currentIndex] = entry
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
}
