/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent/navigationType
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NavigationCurrentEntryChangeEvent/navigationType
 */
export const NAVIGATION_TYPE = {
  PUSH: 'push',
  RELOAD: 'reload',
  REPLACE: 'replace',
  TRAVERSE: 'traverse',
} as const

export type NavigationType =
  (typeof NAVIGATION_TYPE)[keyof typeof NAVIGATION_TYPE]
