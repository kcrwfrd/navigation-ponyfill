'use client'

import {
  navigation,
  type NavigationCurrentEntryChangeEvent,
} from '../lib/navigation'
import { useEffect, type PropsWithChildren } from 'react'

export const NavigationEventListener = ({ children }: PropsWithChildren) => {
  useEffect(() => {
    const handler = (event: NavigationCurrentEntryChangeEvent) => {
      console.log('Navigation type:', event.navigationType) // 'push' | 'replace' | 'traverse'
      console.log('To:', navigation.currentEntry?.url)
      console.log('From:', event.from.url)

      /**
       * Note that this event may fire more often than the old pages router
       * `routeChangeComplete` event, due to history.replace() calls that occur
       * within the next.js router internals. You may wish to compare the URLs.
       */
      if (event.from.url !== navigation.currentEntry?.url) {
        console.log('routeChangeComplete:', navigation.currentEntry?.url)
      }
    }

    // @todo release forthcoming to fix the event handler types - assert for now
    navigation.addEventListener('currententrychange', handler as EventListener)

    return () => {
      navigation.removeEventListener(
        'currententrychange',
        handler as EventListener,
      )
    }
  }, [])

  return children
}
