import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, provide } from 'vue'
import ToastHost from './ToastHost.vue'
import { createToastBus } from './createToastBus'
import { useToast } from './useToast'
import { toastKey } from './types'

/**
 * Integration test for the Toast subsystem.
 *
 * `App.vue` provides the bus; `ToastHost` consumes it via inject. We
 * recreate that wiring with a tiny harness component so we exercise the
 * symbol-keyed provide/inject path that `renderComposable` can't reach.
 *
 * Note: `useToast()` must run in a CHILD of the provider, not in the same
 * setup as `provide` (Vue does not let a component inject from its own
 * provides). The `Consumer` child surfaces `useToast` to the test.
 */
function harness(bus = createToastBus({ autoDismissMs: 0 })) {
  const Consumer = defineComponent({
    setup() {
      const api = useToast()
      ;(globalThis as unknown as { __toast__: typeof api }).__toast__ = api
      return () => null
    },
  })
  const Harness = defineComponent({
    setup() {
      provide(toastKey, bus)
      return () => [h(Consumer), h(ToastHost)]
    },
  })
  return { Harness, bus }
}

describe('ToastHost', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    delete (globalThis as { __toast__?: unknown }).__toast__
  })

  it('renders nothing visible when the bus queue is empty', () => {
    const { Harness } = harness()
    const w = mount(Harness, { attachTo: document.body })
    expect(w.findAll('[role="status"]')).toHaveLength(0)
    w.unmount()
  })

  it('renders one role="status" node per toast in the queue', async () => {
    const { Harness, bus } = harness()
    const w = mount(Harness, { attachTo: document.body })

    bus.push('Héroe guardado', 'success')
    bus.push('Algo falló', 'error')
    await flushPromises()

    const items = w.findAll('[role="status"]')
    expect(items).toHaveLength(2)
    expect(items[0]!.text()).toContain('Héroe guardado')
    expect(items[1]!.text()).toContain('Algo falló')
    w.unmount()
  })

  it('the container region is labelled "Avisos" for screen readers', () => {
    const { Harness } = harness()
    const w = mount(Harness, { attachTo: document.body })
    const region = w.find('[aria-label="Avisos"]')
    expect(region.exists()).toBe(true)
    w.unmount()
  })

  it('dismiss button removes the toast from the queue', async () => {
    const { Harness, bus } = harness()
    const w = mount(Harness, { attachTo: document.body })

    bus.push('Va y viene')
    await flushPromises()
    expect(bus.toasts.value).toHaveLength(1)

    const dismissBtn = w.find('button[aria-label="Descartar aviso"]')
    expect(dismissBtn.exists()).toBe(true)
    await dismissBtn.trigger('click')
    await flushPromises()

    expect(bus.toasts.value).toHaveLength(0)
    expect(w.findAll('[role="status"]')).toHaveLength(0)
    w.unmount()
  })

  it('exposes the inject path: useToast() inside the same provider returns a working API', async () => {
    const { Harness, bus } = harness()
    const w = mount(Harness, { attachTo: document.body })

    const api = (globalThis as unknown as { __toast__: ReturnType<typeof useToast> }).__toast__
    api.push('vía useToast', 'info')
    await flushPromises()

    expect(bus.toasts.value).toHaveLength(1)
    expect(bus.toasts.value[0]!.message).toBe('vía useToast')
    w.unmount()
  })
})
