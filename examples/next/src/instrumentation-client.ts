import { navigation } from 'navigation-ponyfill'

// Expose on window.nav for debugging
;(window as Window & { nav?: typeof navigation }).nav = navigation
