import { readonly, ref, type Ref } from 'vue'
import type { ToastBus, ToastItem, ToastVariant } from './types'

const DEFAULT_AUTO_DISMISS_MS = 3000

export interface ToastBusOptions {
  /** Override auto-dismiss delay. Pass `0` to disable. Default 3000 ms. */
  autoDismissMs?: number
}

/**
 * Build a fresh ToastBus instance. Called once from App.vue (the canonical
 * provider per docs/plan.md §4.3). Each call wires its own queue + timer
 * registry, so tests can spin one up in isolation and not bleed state
 * across describe blocks.
 */
export function createToastBus(options: ToastBusOptions = {}): ToastBus {
  const autoDismissMs = options.autoDismissMs ?? DEFAULT_AUTO_DISMISS_MS
  const queue: Ref<ToastItem[]> = ref([])
  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  let counter = 0

  function dismiss(id: string): void {
    const idx = queue.value.findIndex((t) => t.id === id)
    if (idx >= 0) queue.value.splice(idx, 1)
    const handle = timers.get(id)
    if (handle !== undefined) {
      clearTimeout(handle)
      timers.delete(id)
    }
  }

  function push(message: string, variant: ToastVariant = 'info'): string {
    counter += 1
    const id = `toast-${counter}`
    queue.value.push({ id, message, variant })
    if (autoDismissMs > 0) {
      timers.set(
        id,
        setTimeout(() => dismiss(id), autoDismissMs),
      )
    }
    return id
  }

  return {
    toasts: readonly(queue) as ToastBus['toasts'],
    push,
    dismiss,
    autoDismissMs,
  }
}
