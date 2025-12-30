import { NavigationHistoryEntry } from './NavigationHistoryEntry'
import type { NavigationType } from './NavigationType'

interface NavigationCurrentEntryChangeEventInit extends EventInit {
  from: NavigationHistoryEntry
  navigationType: NavigationType
}

// Not sure if other types are supposed to be allowed?
type EventType = 'currententrychange'

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NavigationCurrentEntryChangeEvent
 */
export class NavigationCurrentEntryChangeEvent extends Event {
  readonly from: NavigationHistoryEntry
  readonly navigationType: NavigationType

  constructor(type: EventType, options: NavigationCurrentEntryChangeEventInit) {
    super(type, options)

    const { from, navigationType } = options

    this.from = from
    this.navigationType = navigationType
  }
}
