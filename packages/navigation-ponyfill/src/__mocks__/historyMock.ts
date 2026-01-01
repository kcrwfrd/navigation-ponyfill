/**
 * Mock History implementation for testing.
 * Tracks all method calls and maintains internal state.
 */
export class MockHistory {
  private _state: any = null
  private _stack: Array<{ state: any; url: string }> = []
  private _index: number = -1

  public pushStateCalls: Array<{ state: any; title: string; url?: string }> = []
  public replaceStateCalls: Array<{
    state: any
    title: string
    url?: string
  }> = []

  get state() {
    return this._state
  }

  pushState = (state: any, title: string, url?: string | URL | null) => {
    this.pushStateCalls.push({ state, title, url: url?.toString() })
    this._state = state
    this._index++
    this._stack[this._index] = { state, url: url?.toString() ?? '' }
    this._stack.length = this._index + 1
  }

  replaceState = (state: any, title: string, url?: string | URL | null) => {
    this.replaceStateCalls.push({ state, title, url: url?.toString() })
    this._state = state
    if (this._index >= 0) {
      this._stack[this._index] = { state, url: url?.toString() ?? '' }
    } else {
      this._index = 0
      this._stack[0] = { state, url: url?.toString() ?? '' }
    }
  }

  go(delta: number) {
    const newIndex = this._index + delta
    if (newIndex >= 0 && newIndex < this._stack.length) {
      this._index = newIndex
      this._state = this._stack[newIndex].state
    }
  }

  back() {
    this.go(-1)
  }
  forward() {
    this.go(1)
  }

  reset() {
    this._state = null
    this._stack = []
    this._index = -1
    this.pushStateCalls = []
    this.replaceStateCalls = []
  }
}
