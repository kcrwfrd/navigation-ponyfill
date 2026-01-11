import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NavigationHistoryEntriesStack } from '../NavigationHistoryEntriesStack'
import { NavigationHistoryEntry } from '../NavigationHistoryEntry'

function createEntry(
  key: string,
  options: { id?: string; url?: string } = {},
): NavigationHistoryEntry {
  return new NavigationHistoryEntry({
    id: options.id ?? `id-${key}`,
    key,
    url: options.url ?? `/page-${key}`,
  })
}

describe('NavigationHistoryEntriesStack', () => {
  let stack: NavigationHistoryEntriesStack

  beforeEach(() => {
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
})
