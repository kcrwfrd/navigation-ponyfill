/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NavigationHistoryEntry
 */

export interface NavigationHistoryEntryInit {
  id: string
  index: number
  key: string
  sameDocument?: boolean
  state?: unknown
  url: string | null
}

export class NavigationHistoryEntry extends EventTarget {
  public readonly id!: string
  public readonly key!: string
  /**
   * @todo
   * Wondering if we should remove support for `sameDocument` since during
   * hydration from sessionStorage, we cannot tell if a url was same or different
   * document that had pushState called on it.
   */
  public readonly sameDocument!: boolean
  public readonly url!: string | null

  #state: unknown

  /**
   * Manually setting #index is less robust than accepting a `getIndex()` function
   * which will always return the correct index.
   *
   * We make this trade-off in order to avoid potential O(n^2) operations, but
   * consider if that's the right decision if we run into problems in the future.
   */
  #index: number

  constructor(init: NavigationHistoryEntryInit) {
    super()

    this.#state =
      init.state !== undefined ? structuredClone(init.state) : undefined
    this.#index = init.index

    Object.defineProperty(this, 'id', {
      value: init.id,
      writable: false,
      enumerable: true,
      configurable: false,
    })

    Object.defineProperty(this, 'key', {
      value: init.key,
      writable: false,
      enumerable: true,
      configurable: false,
    })

    Object.defineProperty(this, 'sameDocument', {
      value: init.sameDocument ?? true,
      writable: false,
      enumerable: true,
      configurable: false,
    })

    Object.defineProperty(this, 'url', {
      value: init.url,
      writable: false,
      enumerable: true,
      configurable: false,
    })
  }

  /**
   * Returns the index of this entry in the navigation history entries list,
   * or -1 if the entry is no longer in the list.
   */
  get index(): number {
    return this.#index
  }

  /**
   * Returns a clone of the state associated with this history entry.
   */
  getState(): unknown {
    return this.#state !== undefined ? structuredClone(this.#state) : undefined
  }

  /**
   * Called by the stack when this entry is disposed (removed or replaced).
   * Sets index to -1 and dispatches 'dispose' event.
   *
   * @package
   *
   * @todo
   * Consider refactoring as more robustly private/internal method with the use
   * of a Symbol or a WeakMap shared between modules.
   */
  _setDisposed(): void {
    this.#index = -1
    this.dispatchEvent(new Event('dispose'))
  }

  /**
   * Returns a JSON-serializable representation of this entry.
   * Used for persisting to sessionStorage.
   */
  toJSON(): NavigationHistoryEntryInit {
    return {
      id: this.id,
      index: this.#index,
      key: this.key,
      sameDocument: this.sameDocument,
      state: this.getState(),
      url: this.url,
    }
  }
}
