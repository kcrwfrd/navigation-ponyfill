/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NavigationHistoryEntry
 * @todo flesh out further
 */
export class NavigationHistoryEntry {
  public readonly url!: string | null

  constructor(url: string | null) {
    Object.defineProperty(this, 'url', {
      value: url,
      writable: false,
      enumerable: true,
      configurable: false,
    })
  }
}
