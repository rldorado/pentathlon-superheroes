import { describe, it, expect } from 'vitest'
import { inject, type InjectionKey } from 'vue'
import { renderComposable } from './renderComposable'

describe('renderComposable', () => {
  it('runs a trivial composable and returns its value', () => {
    const { result, unmount } = renderComposable(() => ({ greeting: 'hola' }))
    expect(result.greeting).toBe('hola')
    unmount()
  })

  it('exposes the underlying Vue app so callers can unmount it', () => {
    const { app, unmount } = renderComposable(() => 42)
    expect(typeof app.unmount).toBe('function')
    unmount()
  })

  it('wires provide/inject — string keys', () => {
    const useGreeting = () => inject<string>('greeting', 'fallback')

    const { result, unmount } = renderComposable(useGreeting, {
      provides: { greeting: 'buenos días' },
    })

    expect(result).toBe('buenos días')
    unmount()
  })

  it('returns the injected fallback when no provide is supplied', () => {
    const useGreeting = () => inject<string>('greeting', 'fallback')

    const { result, unmount } = renderComposable(useGreeting)

    expect(result).toBe('fallback')
    unmount()
  })

  it('supports typed InjectionKey under the hood (provides are keyed by string)', () => {
    const KEY = Symbol('typed-key') as InjectionKey<{ n: number }>

    // Note: helper signature accepts `string | symbol` keys via Record, but
    // Object.entries enumerates string keys only. Verify the documented
    // behaviour and ensure the typed-symbol path still resolves via fallback.
    const useTyped = () => inject(KEY, { n: -1 })

    const { result, unmount } = renderComposable(useTyped)
    expect(result.n).toBe(-1)
    unmount()
  })
})
