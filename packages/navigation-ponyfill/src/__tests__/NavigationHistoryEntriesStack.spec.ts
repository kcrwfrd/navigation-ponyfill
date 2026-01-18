import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NavigationHistoryEntriesStack } from '../NavigationHistoryEntriesStack'
import { NavigationHistoryEntry } from '../NavigationHistoryEntry'

function createEntry(
  key: string,
  options: { id?: string; url?: string; index?: number } = {},
): NavigationHistoryEntry {
  return new NavigationHistoryEntry({
    id: options.id ?? `id-${key}`,
    key,
    url: options.url ?? `/page-${key}`,
    index: options.index ?? 0,
  })
}

describe('NavigationHistoryEntriesStack', () => {
  let stack: NavigationHistoryEntriesStack

  beforeEach(() => {
    // Clear sessionStorage before each test
    NavigationHistoryEntriesStack.clearStorage()
    stack = new NavigationHistoryEntriesStack()
  })

  describe('initial state', () => {
    it('should have null currentEntry when empty', () => {
      expect(stack.currentEntry).toBe(null)
    })

    it('should have currentIndex of -1 when empty', () => {
      expect(stack.currentIndex).toBe(-1)
    })

    it('should return empty array from entries()', () => {
      expect(stack.entries()).toEqual([])
    })
  })

  describe('push()', () => {
    it('should add entry to stack', () => {
      const entry = createEntry('a')
      stack.push(entry)

      expect(stack.currentEntry).toBe(entry)
      expect(stack.currentIndex).toBe(0)
      expect(stack.entries()).toEqual([entry])
    })

    it('should add multiple entries', () => {
      const entry1 = createEntry('a')
      const entry2 = createEntry('b')
      const entry3 = createEntry('c')

      stack.push(entry1)
      stack.push(entry2)
      stack.push(entry3)

      expect(stack.currentEntry).toBe(entry3)
      expect(stack.currentIndex).toBe(2)
      expect(stack.entries()).toEqual([entry1, entry2, entry3])
    })

    it('should truncate forward history when pushing after traverse', () => {
      const entry1 = createEntry('a')
      const entry2 = createEntry('b')
      const entry3 = createEntry('c')

      stack.push(entry1)
      stack.push(entry2)
      stack.push(entry3)

      // Traverse back to entry1
      stack.traverseTo('a')
      expect(stack.currentIndex).toBe(0)

      // Push a new entry - should truncate entry2 and entry3
      const entry4 = createEntry('d')
      stack.push(entry4)

      expect(stack.currentIndex).toBe(1)
      expect(stack.entries()).toEqual([entry1, entry4])
    })

    it('should dispatch dispose event on truncated entries', () => {
      const entry1 = createEntry('a')
      const entry2 = createEntry('b')
      const entry3 = createEntry('c')

      const disposeHandler2 = vi.fn()
      const disposeHandler3 = vi.fn()
      entry2.addEventListener('dispose', disposeHandler2)
      entry3.addEventListener('dispose', disposeHandler3)

      stack.push(entry1)
      stack.push(entry2)
      stack.push(entry3)

      // Traverse back to entry1
      stack.traverseTo('a')

      // Push a new entry - should dispatch dispose on entry2 and entry3
      const entry4 = createEntry('d')
      stack.push(entry4)

      expect(disposeHandler2).toHaveBeenCalledTimes(1)
      expect(disposeHandler3).toHaveBeenCalledTimes(1)
    })
  })

  describe('replace()', () => {
    it('should replace current entry', () => {
      const entry1 = createEntry('a')
      stack.push(entry1)

      const entry2 = createEntry('a', { id: 'new-id' })
      stack.replace(entry2)

      expect(stack.currentEntry).toBe(entry2)
      expect(stack.currentIndex).toBe(0)
      expect(stack.entries()).toEqual([entry2])
    })

    it('should keep same index after replace', () => {
      const entry1 = createEntry('a')
      const entry2 = createEntry('b')
      const entry3 = createEntry('c')

      stack.push(entry1)
      stack.push(entry2)
      stack.push(entry3)

      // Traverse to entry2
      stack.traverseTo('b')
      expect(stack.currentIndex).toBe(1)

      // Replace entry2
      const newEntry2 = createEntry('b', { id: 'new-id-2' })
      stack.replace(newEntry2)

      expect(stack.currentIndex).toBe(1)
      expect(stack.currentEntry).toBe(newEntry2)
      expect(stack.entries()).toEqual([entry1, newEntry2, entry3])
    })

    it('should dispatch dispose event on replaced entry', () => {
      const entry1 = createEntry('a')
      const disposeHandler = vi.fn()
      entry1.addEventListener('dispose', disposeHandler)

      stack.push(entry1)

      const entry2 = createEntry('a', { id: 'new-id' })
      stack.replace(entry2)

      expect(disposeHandler).toHaveBeenCalledTimes(1)
    })

    it('should treat replace on empty stack as push', () => {
      const entry = createEntry('a')
      stack.replace(entry)

      expect(stack.currentEntry).toBe(entry)
      expect(stack.currentIndex).toBe(0)
      expect(stack.entries()).toEqual([entry])
    })
  })

  describe('traverseTo()', () => {
    it('should traverse to entry by key', () => {
      const entry1 = createEntry('a')
      const entry2 = createEntry('b')
      const entry3 = createEntry('c')

      stack.push(entry1)
      stack.push(entry2)
      stack.push(entry3)

      const result = stack.traverseTo('a')

      expect(result).toBe(entry1)
      expect(stack.currentEntry).toBe(entry1)
      expect(stack.currentIndex).toBe(0)
    })

    it('should return null for unknown key', () => {
      const entry1 = createEntry('a')
      stack.push(entry1)

      const result = stack.traverseTo('unknown')

      expect(result).toBe(null)
      expect(stack.currentEntry).toBe(entry1)
      expect(stack.currentIndex).toBe(0)
    })

    it('should not change currentIndex for unknown key', () => {
      const entry1 = createEntry('a')
      const entry2 = createEntry('b')

      stack.push(entry1)
      stack.push(entry2)

      stack.traverseTo('unknown')

      expect(stack.currentIndex).toBe(1)
    })

    it('should allow traversing forward', () => {
      const entry1 = createEntry('a')
      const entry2 = createEntry('b')
      const entry3 = createEntry('c')

      stack.push(entry1)
      stack.push(entry2)
      stack.push(entry3)

      stack.traverseTo('a')
      expect(stack.currentIndex).toBe(0)

      stack.traverseTo('c')
      expect(stack.currentIndex).toBe(2)
      expect(stack.currentEntry).toBe(entry3)
    })
  })

  describe('findByKey()', () => {
    it('should find entry by key', () => {
      const entry1 = createEntry('a')
      const entry2 = createEntry('b')

      stack.push(entry1)
      stack.push(entry2)

      expect(stack.findByKey('a')).toBe(entry1)
      expect(stack.findByKey('b')).toBe(entry2)
    })

    it('should return null for unknown key', () => {
      const entry = createEntry('a')
      stack.push(entry)

      expect(stack.findByKey('unknown')).toBe(null)
    })
  })

  describe('getIndexByKey()', () => {
    it('should return correct index for key', () => {
      const entry1 = createEntry('a')
      const entry2 = createEntry('b')
      const entry3 = createEntry('c')

      stack.push(entry1)
      stack.push(entry2)
      stack.push(entry3)

      expect(stack.getIndexByKey('a')).toBe(0)
      expect(stack.getIndexByKey('b')).toBe(1)
      expect(stack.getIndexByKey('c')).toBe(2)
    })

    it('should return -1 for unknown key', () => {
      const entry = createEntry('a')
      stack.push(entry)

      expect(stack.getIndexByKey('unknown')).toBe(-1)
    })
  })

  describe('entries()', () => {
    it('should return a shallow copy', () => {
      const entry1 = createEntry('a')
      const entry2 = createEntry('b')

      stack.push(entry1)
      stack.push(entry2)

      const entriesArray = stack.entries()
      entriesArray.push(createEntry('c'))

      // Original stack should not be affected
      expect(stack.entries()).toHaveLength(2)
    })

    it('should return entries in order', () => {
      const entry1 = createEntry('a')
      const entry2 = createEntry('b')
      const entry3 = createEntry('c')

      stack.push(entry1)
      stack.push(entry2)
      stack.push(entry3)

      const entries = stack.entries()
      expect(entries[0]).toBe(entry1)
      expect(entries[1]).toBe(entry2)
      expect(entries[2]).toBe(entry3)
    })
  })

  describe('findById()', () => {
    it('should find entry by id', () => {
      const entry1 = createEntry('a', { id: 'entry-1' })
      const entry2 = createEntry('b', { id: 'entry-2' })

      stack.push(entry1)
      stack.push(entry2)

      expect(stack.findById('entry-1')).toBe(entry1)
      expect(stack.findById('entry-2')).toBe(entry2)
    })

    it('should return null for unknown id', () => {
      const entry = createEntry('a', { id: 'entry-1' })
      stack.push(entry)

      expect(stack.findById('unknown')).toBe(null)
    })
  })

  describe('getIndexById()', () => {
    it('should return correct index for id', () => {
      const entry1 = createEntry('a', { id: 'entry-1' })
      const entry2 = createEntry('b', { id: 'entry-2' })
      const entry3 = createEntry('c', { id: 'entry-3' })

      stack.push(entry1)
      stack.push(entry2)
      stack.push(entry3)

      expect(stack.getIndexById('entry-1')).toBe(0)
      expect(stack.getIndexById('entry-2')).toBe(1)
      expect(stack.getIndexById('entry-3')).toBe(2)
    })

    it('should return -1 for unknown id', () => {
      const entry = createEntry('a', { id: 'entry-1' })
      stack.push(entry)

      expect(stack.getIndexById('unknown')).toBe(-1)
    })
  })

  describe('setCurrentIndex()', () => {
    it('should set the current index', () => {
      const entry1 = createEntry('a', { index: 0 })
      const entry2 = createEntry('b', { index: 1 })
      const entry3 = createEntry('c', { index: 2 })

      stack.push(entry1)
      stack.push(entry2)
      stack.push(entry3)

      stack.setCurrentIndex(1)

      expect(stack.currentIndex).toBe(1)
      expect(stack.currentEntry).toBe(entry2)
    })
  })

  describe('sessionStorage persistence', () => {
    it('should save entries to sessionStorage on push', () => {
      const entry = createEntry('a', { id: 'entry-1', index: 0 })
      stack.push(entry)

      const stored = sessionStorage.getItem('__NAVIGATION_PONYFILL_ENTRIES')
      expect(stored).not.toBe(null)

      const parsed = JSON.parse(stored!)
      expect(parsed.entries).toHaveLength(1)
      expect(parsed.entries[0].id).toBe('entry-1')
    })

    it('should save entries to sessionStorage on replace', () => {
      const entry1 = createEntry('a', { id: 'entry-1', index: 0 })
      stack.push(entry1)

      const entry2 = createEntry('a', { id: 'entry-2', index: 0 })
      stack.replace(entry2)

      const stored = sessionStorage.getItem('__NAVIGATION_PONYFILL_ENTRIES')
      const parsed = JSON.parse(stored!)
      expect(parsed.entries).toHaveLength(1)
      expect(parsed.entries[0].id).toBe('entry-2')
    })

    it('should load entries from sessionStorage on construction', () => {
      // First, create a stack and add entries
      const entry1 = createEntry('a', { id: 'entry-1', index: 0 })
      const entry2 = createEntry('b', { id: 'entry-2', index: 1 })
      stack.push(entry1)
      stack.push(entry2)

      // Create a new stack - it should load from sessionStorage
      const newStack = new NavigationHistoryEntriesStack()

      expect(newStack.entries()).toHaveLength(2)
      expect(newStack.entries()[0].id).toBe('entry-1')
      expect(newStack.entries()[1].id).toBe('entry-2')
    })

    it('should not persist currentIndex (it should be -1 after reload)', () => {
      const entry1 = createEntry('a', { index: 0 })
      const entry2 = createEntry('b', { index: 1 })
      stack.push(entry1)
      stack.push(entry2)

      // Current index is 1 now
      expect(stack.currentIndex).toBe(1)

      // Create a new stack - currentIndex should be -1 (not loaded)
      const newStack = new NavigationHistoryEntriesStack()

      expect(newStack.currentIndex).toBe(-1)
      expect(newStack.currentEntry).toBe(null)
    })

    it('should preserve entry state through persistence', () => {
      const entry = new NavigationHistoryEntry({
        id: 'entry-1',
        key: 'key-1',
        url: '/page',
        index: 0,
        state: { counter: 42, nested: { value: 'test' } },
        sameDocument: true,
      })
      stack.push(entry)

      const newStack = new NavigationHistoryEntriesStack()
      const loadedEntry = newStack.entries()[0]

      expect(loadedEntry.getState()).toEqual({
        counter: 42,
        nested: { value: 'test' },
      })
    })
  })

  describe('clearStorage()', () => {
    it('should remove entries from sessionStorage', () => {
      const entry = createEntry('a')
      stack.push(entry)

      expect(sessionStorage.getItem('__NAVIGATION_PONYFILL_ENTRIES')).not.toBe(
        null,
      )

      NavigationHistoryEntriesStack.clearStorage()

      expect(sessionStorage.getItem('__NAVIGATION_PONYFILL_ENTRIES')).toBe(null)
    })
  })

  describe('sessionStorage error handling', () => {
    it('should warn when entry index mismatches array position', () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {})

      // Manually store entries with mismatched indices
      const entriesData = {
        entries: [
          {
            id: 'id-1',
            key: 'key-1',
            url: '/page1',
            index: 5,
            sameDocument: true,
          },
          {
            id: 'id-2',
            key: 'key-2',
            url: '/page2',
            index: 10,
            sameDocument: true,
          },
        ],
      }
      sessionStorage.setItem(
        '__NAVIGATION_PONYFILL_ENTRIES',
        JSON.stringify(entriesData),
      )

      // Create a new stack which loads from sessionStorage
      const newStack = new NavigationHistoryEntriesStack()

      // Should have loaded the entries
      expect(newStack.entries()).toHaveLength(2)

      // Should have warned about index mismatch
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "NavigationHistoryEntry index mismatch: 5 !== 0 for entry id 'id-1'",
      )
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "NavigationHistoryEntry index mismatch: 10 !== 1 for entry id 'id-2'",
      )

      // Entries should have corrected indices
      expect(newStack.entries()[0].index).toBe(0)
      expect(newStack.entries()[1].index).toBe(1)

      consoleWarnSpy.mockRestore()
    })

    it('should log error when sessionStorage contains invalid JSON', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      // Store invalid JSON
      sessionStorage.setItem(
        '__NAVIGATION_PONYFILL_ENTRIES',
        'invalid json {{{',
      )

      // Create a new stack which attempts to load from sessionStorage
      const newStack = new NavigationHistoryEntriesStack()

      // Should have empty entries due to parse failure
      expect(newStack.entries()).toHaveLength(0)

      // Should have logged error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to load navigation-ponyfill entries from sessionStorage with storage key: '__NAVIGATION_PONYFILL_ENTRIES'",
      )
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2) // Error message + actual error

      consoleErrorSpy.mockRestore()
    })

    it('should log error when sessionStorage save fails', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      vi.stubGlobal('sessionStorage', {
        setItem: vi.fn().mockImplementation(() => {
          throw new Error('QuotaExceededError')
        }),
      })

      // Push an entry - this triggers save which should fail
      const entry = createEntry('a')
      stack.push(entry)

      // Should have logged error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to save navigation-ponyfill entries to sessionStorage with storage key: '__NAVIGATION_PONYFILL_ENTRIES'",
      )
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2) // Error message + actual error

      // Restore mocks
      consoleErrorSpy.mockRestore()
      vi.unstubAllGlobals()
    })
  })
})
