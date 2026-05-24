import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createToastBus } from './createToastBus'

/**
 * `createToastBus` is a plain, framework-light factory (it uses Vue's `ref`
 * but exposes no component context), so we test it as a plain function per
 * docs/constitution.md §4.3.
 */
describe('createToastBus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with an empty queue', () => {
    const bus = createToastBus()
    expect(bus.toasts.value).toEqual([])
  })

  it('push() appends a toast with the requested message and default `info` variant', () => {
    const bus = createToastBus()
    const id = bus.push('Héroe guardado')
    expect(bus.toasts.value).toHaveLength(1)
    expect(bus.toasts.value[0]).toMatchObject({
      id,
      message: 'Héroe guardado',
      variant: 'info',
    })
  })

  it('push() accepts explicit variants (success / error)', () => {
    const bus = createToastBus()
    bus.push('Listo', 'success')
    bus.push('Falló', 'error')
    expect(bus.toasts.value.map((t) => t.variant)).toEqual(['success', 'error'])
  })

  it('returns a unique id per push', () => {
    const bus = createToastBus()
    const a = bus.push('A')
    const b = bus.push('B')
    expect(a).not.toBe(b)
  })

  it('auto-dismisses after `autoDismissMs` (default 3000)', () => {
    const bus = createToastBus()
    expect(bus.autoDismissMs).toBe(3000)

    bus.push('Auto')
    expect(bus.toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(2999)
    expect(bus.toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(1)
    expect(bus.toasts.value).toHaveLength(0)
  })

  it('dismiss(id) removes the toast and cancels its auto-dismiss timer', () => {
    const bus = createToastBus()
    const id = bus.push('Manual')

    bus.dismiss(id)
    expect(bus.toasts.value).toHaveLength(0)

    // Advance past the auto-dismiss window — no errors (timer is already
    // cleared) and the queue stays empty.
    vi.advanceTimersByTime(5000)
    expect(bus.toasts.value).toHaveLength(0)
  })

  it('dismiss(id) is a no-op for unknown ids', () => {
    const bus = createToastBus()
    bus.push('Existe')
    expect(() => bus.dismiss('nope')).not.toThrow()
    expect(bus.toasts.value).toHaveLength(1)
  })

  it('honors `autoDismissMs: 0` as "do not auto-dismiss"', () => {
    const bus = createToastBus({ autoDismissMs: 0 })
    bus.push('Sticky')
    vi.advanceTimersByTime(10_000)
    expect(bus.toasts.value).toHaveLength(1)
  })

  it('toasts queue is exposed as readonly (mutating from outside is forbidden by typing)', () => {
    const bus = createToastBus()
    // Type assertion: bus.toasts.value is `readonly ToastItem[]`. We can't
    // .push() into it. Runtime guard: the underlying array is the same
    // reference, but our convention is that consumers never mutate it.
    expect(Array.isArray(bus.toasts.value)).toBe(true)
  })
})
