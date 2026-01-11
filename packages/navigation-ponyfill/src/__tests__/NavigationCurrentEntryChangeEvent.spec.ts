import { describe, it, expect } from 'vitest'
import { NavigationCurrentEntryChangeEvent } from '../NavigationCurrentEntryChangeEvent'
import { NavigationHistoryEntry } from '../NavigationHistoryEntry'

function createEntry(url: string | null): NavigationHistoryEntry {
  return new NavigationHistoryEntry({
    id: 'test-id',
    key: 'test-key',
    url,
    index: 0,
  })
}

describe('NavigationCurrentEntryChangeEvent', () => {
  describe('constructor', () => {
    it('should extend Event class', () => {
      const entry = createEntry('/from')
      const event = new NavigationCurrentEntryChangeEvent(
        'currententrychange',
        {
          from: entry,
          navigationType: 'push',
        },
      )

      expect(event).toBeInstanceOf(Event)
    })

    it('should have type "currententrychange"', () => {
      const entry = createEntry('/from')
      const event = new NavigationCurrentEntryChangeEvent(
        'currententrychange',
        {
          from: entry,
          navigationType: 'push',
        },
      )

      expect(event.type).toBe('currententrychange')
    })
  })

  describe('from property', () => {
    it('should return NavigationHistoryEntry from options', () => {
      const entry = createEntry('/previous-page')
      const event = new NavigationCurrentEntryChangeEvent(
        'currententrychange',
        {
          from: entry,
          navigationType: 'push',
        },
      )

      expect(event.from).toBe(entry)
      expect(event.from.url).toBe('/previous-page')
    })

    it('should handle entry with null URL', () => {
      const entry = createEntry(null)
      const event = new NavigationCurrentEntryChangeEvent(
        'currententrychange',
        {
          from: entry,
          navigationType: 'traverse',
        },
      )

      expect(event.from.url).toBe(null)
    })
  })

  describe('navigationType property', () => {
    it('should accept "push" type', () => {
      const entry = createEntry('/path')
      const event = new NavigationCurrentEntryChangeEvent(
        'currententrychange',
        {
          from: entry,
          navigationType: 'push',
        },
      )

      expect(event.navigationType).toBe('push')
    })

    it('should accept "replace" type', () => {
      const entry = createEntry('/path')
      const event = new NavigationCurrentEntryChangeEvent(
        'currententrychange',
        {
          from: entry,
          navigationType: 'replace',
        },
      )

      expect(event.navigationType).toBe('replace')
    })

    it('should accept "traverse" type', () => {
      const entry = createEntry('/path')
      const event = new NavigationCurrentEntryChangeEvent(
        'currententrychange',
        {
          from: entry,
          navigationType: 'traverse',
        },
      )

      expect(event.navigationType).toBe('traverse')
    })

    it('should accept "reload" type', () => {
      const entry = createEntry('/path')
      const event = new NavigationCurrentEntryChangeEvent(
        'currententrychange',
        {
          from: entry,
          navigationType: 'reload',
        },
      )

      expect(event.navigationType).toBe('reload')
    })

    it('should handle null navigationType', () => {
      const entry = createEntry('/path')
      const event = new NavigationCurrentEntryChangeEvent(
        'currententrychange',
        {
          from: entry,
          navigationType: null,
        },
      )

      expect(event.navigationType).toBe(null)
    })

    it('should coerce undefined navigationType to null', () => {
      const entry = createEntry('/path')
      const event = new NavigationCurrentEntryChangeEvent(
        'currententrychange',
        {
          from: entry,
          navigationType: undefined,
        },
      )

      expect(event.navigationType).toBe(null)
    })
  })

  describe('inherited Event properties', () => {
    it('should support bubbles option', () => {
      const entry = createEntry('/path')
      const event = new NavigationCurrentEntryChangeEvent(
        'currententrychange',
        {
          from: entry,
          navigationType: 'push',
          bubbles: true,
        },
      )

      expect(event.bubbles).toBe(true)
    })

    it('should support cancelable option', () => {
      const entry = createEntry('/path')
      const event = new NavigationCurrentEntryChangeEvent(
        'currententrychange',
        {
          from: entry,
          navigationType: 'push',
          cancelable: true,
        },
      )

      expect(event.cancelable).toBe(true)
    })

    it('should default bubbles to false', () => {
      const entry = createEntry('/path')
      const event = new NavigationCurrentEntryChangeEvent(
        'currententrychange',
        {
          from: entry,
          navigationType: 'push',
        },
      )

      expect(event.bubbles).toBe(false)
    })

    it('should default cancelable to false', () => {
      const entry = createEntry('/path')
      const event = new NavigationCurrentEntryChangeEvent(
        'currententrychange',
        {
          from: entry,
          navigationType: 'push',
        },
      )

      expect(event.cancelable).toBe(false)
    })

    it('should default composed to false', () => {
      const entry = createEntry('/path')
      const event = new NavigationCurrentEntryChangeEvent(
        'currententrychange',
        {
          from: entry,
          navigationType: 'push',
        },
      )

      expect(event.composed).toBe(false)
    })
  })

  describe('readonly properties', () => {
    it('should not allow reassigning from property', () => {
      const entry = createEntry('/path')
      const event = new NavigationCurrentEntryChangeEvent(
        'currententrychange',
        {
          from: entry,
          navigationType: 'push',
        },
      )

      const newEntry = createEntry('/other')

      expect(() => {
        // @ts-expect-error
        event.from = newEntry
      }).toThrow(TypeError)
      expect(event.from).toBe(entry)
    })

    it('should not allow reassigning navigationType property', () => {
      const entry = createEntry('/path')
      const event = new NavigationCurrentEntryChangeEvent(
        'currententrychange',
        {
          from: entry,
          navigationType: 'push',
        },
      )

      expect(() => {
        // @ts-expect-error
        event.navigationType = 'replace'
      }).toThrow(TypeError)
      expect(event.navigationType).toBe('push')
    })
  })
})
