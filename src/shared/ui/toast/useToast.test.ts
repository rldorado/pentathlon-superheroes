import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderComposable } from '@/shared/testing/renderComposable'
import { useToast } from './useToast'
import { createToastBus } from './createToastBus'

/**
 * Tested through `renderComposable` per docs/constitution.md §4.2.
 *
 * The bus is passed as an explicit argument because the canonical helper
 * only forwards string-keyed `provides` (its documented limitation). The
 * inject path is covered by the `ToastHost` integration test.
 */
describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns { push, dismiss } when called with an explicit bus', () => {
    const bus = createToastBus({ autoDismissMs: 0 })

    const { result, unmount } = renderComposable(() => useToast(bus))

    expect(typeof result.push).toBe('function')
    expect(typeof result.dismiss).toBe('function')
    unmount()
  })

  it('push(message, variant) appends to the shared bus queue', () => {
    const bus = createToastBus({ autoDismissMs: 0 })

    const { result, unmount } = renderComposable(() => useToast(bus))
    const id = result.push('Héroe guardado', 'success')

    expect(bus.toasts.value).toHaveLength(1)
    expect(bus.toasts.value[0]).toMatchObject({ id, variant: 'success' })
    unmount()
  })

  it('dismiss(id) removes the toast from the bus queue', () => {
    const bus = createToastBus({ autoDismissMs: 0 })

    const { result, unmount } = renderComposable(() => useToast(bus))
    const id = result.push('Va y viene')
    expect(bus.toasts.value).toHaveLength(1)

    result.dismiss(id)
    expect(bus.toasts.value).toHaveLength(0)
    unmount()
  })

  it('throws a descriptive Spanish-hint error when no bus is provided', () => {
    expect(() => renderComposable(() => useToast())).toThrow(/ToastHost/)
  })
})
