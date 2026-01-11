/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NavigationHistoryEntry
 */

export interface NavigationHistoryEntryInit {
  getIndex?: () => number
  id: string
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
  #getIndex: () => number

  constructor(init: NavigationHistoryEntryInit) {
    super()

    this.#state =
      init.state !== undefined ? structuredClone(init.state) : undefined
    this.#getIndex = init.getIndex ?? (() => -1)

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
    return this.#getIndex()
  }

  /**
   * Returns a clone of the state associated with this history entry.
   */
  getState(): unknown {
    return this.#state !== undefined ? structuredClone(this.#state) : undefined
  }
}
