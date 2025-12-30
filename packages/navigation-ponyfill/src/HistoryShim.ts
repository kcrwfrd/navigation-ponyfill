/**
 * A no-op shim for the History API so that our apps don't implode during SSR
 */
export class HistoryShim {
  public readonly state = null

  constructor() {}

  pushState(state: any, _unused: string, url?: string | URL | null) {
    return
  }

  replaceState(state: any, _unused: string, url?: string | URL | null) {
    return
  }
}
