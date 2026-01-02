import { NavigationHistoryEntry } from './NavigationHistoryEntry'
import type { NavigationType } from './NavigationType'

interface NavigationCurrentEntryChangeEventInit extends EventInit {
  from: NavigationHistoryEntry
  navigationType?: NavigationType | null
}

// Not sure if other types are supposed to be allowed?
type EventType = 'currententrychange'

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NavigationCurrentEntryChangeEvent
 */
export class NavigationCurrentEntryChangeEvent extends Event {
  readonly from!: NavigationHistoryEntry
  readonly navigationType!: NavigationType | null

  constructor(type: EventType, options: NavigationCurrentEntryChangeEventInit) {
    super(type, { bubbles: false, cancelable: false, ...options })

    const { from, navigationType = null } = options

    Object.defineProperty(this, 'from', {
      value: from,
      writable: false,
      enumerable: true,
      configurable: false,
    })

    Object.defineProperty(this, 'navigationType', {
      value: navigationType,
      writable: false,
      enumerable: true,
      configurable: false,
    })
  }
}
