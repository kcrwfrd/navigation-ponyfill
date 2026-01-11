import { describe, it, expect, vi } from 'vitest'
import { NavigationHistoryEntry } from '../NavigationHistoryEntry'

describe('NavigationHistoryEntry', () => {
  describe('constructor', () => {
    it('should accept required properties', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/path/to/page',
      })
      expect(entry.id).toBe('test-id')
      expect(entry.key).toBe('test-key')
      expect(entry.url).toBe('/path/to/page')
    })

    it('should accept null URL', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: null,
      })
      expect(entry.url).toBe(null)
    })

    it('should accept full URL with query and hash', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page?foo=bar#section',
      })
      expect(entry.url).toBe('/page?foo=bar#section')
    })

    it('should accept empty string URL', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '',
      })
      expect(entry.url).toBe('')
    })

    it('should default sameDocument to true', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
      })
      expect(entry.sameDocument).toBe(true)
    })

    it('should accept sameDocument option', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
        sameDocument: false,
      })
      expect(entry.sameDocument).toBe(false)
    })
  })

  describe('readonly properties', () => {
    it('id should be readonly', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/initial',
      })

      expect(() => {
        // @ts-expect-error - testing readonly property
        entry.id = 'modified'
      }).toThrow(TypeError)

      expect(entry.id).toBe('test-id')
    })

    it('key should be readonly', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/initial',
      })

      expect(() => {
        // @ts-expect-error - testing readonly property
        entry.key = 'modified'
      }).toThrow(TypeError)

      expect(entry.key).toBe('test-key')
    })

    it('url should be readonly', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/initial',
      })

      expect(() => {
        // @ts-expect-error - testing readonly property
        entry.url = '/modified'
      }).toThrow(TypeError)

      expect(entry.url).toBe('/initial')
    })

    it('sameDocument should be readonly', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/initial',
      })

      expect(() => {
        // @ts-expect-error - testing readonly property
        entry.sameDocument = false
      }).toThrow(TypeError)

      expect(entry.sameDocument).toBe(true)
    })
  })

  describe('index property', () => {
    it('should return -1 when no getIndex function provided', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
      })
      expect(entry.index).toBe(-1)
    })

    it('should return value from getIndex function', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
        getIndex: () => 5,
      })
      expect(entry.index).toBe(5)
    })

    it('should call getIndex function on each access', () => {
      let indexValue = 0
      const getIndex = vi.fn(() => indexValue)

      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
        getIndex,
      })

      expect(entry.index).toBe(0)
      indexValue = 2
      expect(entry.index).toBe(2)
      expect(getIndex).toHaveBeenCalledTimes(2)
    })
  })

  describe('getState()', () => {
    it('should return undefined when no state provided', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
      })
      expect(entry.getState()).toBe(undefined)
    })

    it('should return a clone of the state', () => {
      const originalState = { foo: 'bar', nested: { value: 42 } }
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
        state: originalState,
      })

      const retrievedState = entry.getState() as typeof originalState
      expect(retrievedState).toEqual(originalState)
      expect(retrievedState).not.toBe(originalState)
    })

    it('should return different clone on each call', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
        state: { value: 1 },
      })

      const state1 = entry.getState()
      const state2 = entry.getState()
      expect(state1).toEqual(state2)
      expect(state1).not.toBe(state2)
    })

    it('should not be affected by mutations to returned state', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
        state: { value: 1 },
      })

      const state = entry.getState() as { value: number }
      state.value = 999

      expect(entry.getState()).toEqual({ value: 1 })
    })

    it('should handle primitive state values', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
        state: 'string-state',
      })
      expect(entry.getState()).toBe('string-state')
    })

    it('should handle array state values', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
        state: [1, 2, 3],
      })
      expect(entry.getState()).toEqual([1, 2, 3])
    })
  })

  describe('EventTarget', () => {
    it('should extend EventTarget', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
      })
      expect(entry).toBeInstanceOf(EventTarget)
    })

    it('should support addEventListener and removeEventListener', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
      })

      const handler = vi.fn()
      entry.addEventListener('dispose', handler)
      entry.dispatchEvent(new Event('dispose'))
      expect(handler).toHaveBeenCalledTimes(1)

      entry.removeEventListener('dispose', handler)
      entry.dispatchEvent(new Event('dispose'))
      expect(handler).toHaveBeenCalledTimes(1)
    })
  })
})
