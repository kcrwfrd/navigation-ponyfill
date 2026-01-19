import { describe, it, expect, vi } from 'vitest'
import { NavigationHistoryEntry } from '../NavigationHistoryEntry'

describe('NavigationHistoryEntry', () => {
  describe('constructor', () => {
    it('should accept required properties', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/path/to/page',
        index: 0,
      })
      expect(entry.id).toBe('test-id')
      expect(entry.key).toBe('test-key')
      expect(entry.url).toBe('/path/to/page')
      expect(entry.index).toBe(0)
    })

    it('should accept null URL', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: null,
        index: 0,
      })
      expect(entry.url).toBe(null)
    })

    it('should accept full URL with query and hash', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page?foo=bar#section',
        index: 0,
      })
      expect(entry.url).toBe('/page?foo=bar#section')
    })

    it('should accept empty string URL', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '',
        index: 0,
      })
      expect(entry.url).toBe('')
    })

    it('should default sameDocument to true', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
        index: 0,
      })
      expect(entry.sameDocument).toBe(true)
    })

    it('should accept sameDocument option', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
        index: 0,
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
        index: 0,
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
        index: 0,
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
        index: 0,
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
        index: 0,
      })

      expect(() => {
        // @ts-expect-error - testing readonly property
        entry.sameDocument = false
      }).toThrow(TypeError)

      expect(entry.sameDocument).toBe(true)
    })
  })

  describe('index property', () => {
    it('should return the index passed in constructor', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
        index: 5,
      })
      expect(entry.index).toBe(5)
    })

    it('should return 0 for first entry', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
        index: 0,
      })
      expect(entry.index).toBe(0)
    })

    it('should return -1 after _setDisposed() is called', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
        index: 3,
      })
      expect(entry.index).toBe(3)

      entry._setDisposed()

      expect(entry.index).toBe(-1)
    })
  })

  describe('getState()', () => {
    it('should return undefined when no state provided', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
        index: 0,
      })
      expect(entry.getState()).toBe(undefined)
    })

    it('should return a clone of the state', () => {
      const originalState = { foo: 'bar', nested: { value: 42 } }
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
        index: 0,
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
        index: 0,
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
        index: 0,
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
        index: 0,
        state: 'string-state',
      })
      expect(entry.getState()).toBe('string-state')
    })

    it('should handle array state values', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
        index: 0,
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
        index: 0,
      })
      expect(entry).toBeInstanceOf(EventTarget)
    })

    it('should support addEventListener and removeEventListener', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
        index: 0,
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

  describe('_setDisposed()', () => {
    it('should set index to -1', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
        index: 5,
      })

      entry._setDisposed()

      expect(entry.index).toBe(-1)
    })

    it('should dispatch dispose event', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
        index: 0,
      })

      const handler = vi.fn()
      entry.addEventListener('dispose', handler)

      entry._setDisposed()

      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('toJSON()', () => {
    it('should return serializable representation', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
        index: 2,
        state: { foo: 'bar' },
        sameDocument: true,
      })

      const json = entry.toJSON()

      expect(json).toEqual({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
        index: 2,
        state: { foo: 'bar' },
        sameDocument: true,
      })
    })

    it('should clone state in toJSON output', () => {
      const originalState = { nested: { value: 42 } }
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
        index: 0,
        state: originalState,
      })

      const json = entry.toJSON() as { state: typeof originalState }

      expect(json.state).toEqual(originalState)
      expect(json.state).not.toBe(originalState)
    })

    it('should handle null URL', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: null,
        index: 0,
      })

      const json = entry.toJSON() as { url: string | null }

      expect(json.url).toBe(null)
    })

    it('should handle undefined state', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
        index: 0,
      })

      const json = entry.toJSON() as { state: unknown }

      expect(json.state).toBe(undefined)
    })

    it('should reflect disposed state', () => {
      const entry = new NavigationHistoryEntry({
        id: 'test-id',
        key: 'test-key',
        url: '/page',
        index: 3,
      })

      entry._setDisposed()

      const json = entry.toJSON() as { index: number }

      expect(json.index).toBe(-1)
    })
  })
})
