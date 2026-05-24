import { inject } from 'vue'
import { toastKey, type ToastBus, type ToastVariant } from './types'

export interface ToastApi {
  push: (message: string, variant?: ToastVariant) => string
  dismiss: (id: string) => void
}

/**
 * Returns the toast API for the current component.
 *
 * Production wiring: `App.vue` provides `toastKey`, and `useToast()` (no
 * argument) injects it. Throwing on a missing bus surfaces wiring bugs
 * immediately.
 *
 * Test ergonomics: the canonical `renderComposable` helper only forwards
 * string-keyed provides (documented limitation in
 * docs/constitution.md §4.2). Passing the bus explicitly is the supported
 * test-time entry point; the inject path is still exercised end-to-end
 * by the `ToastHost` component test, which mounts a real provider.
 */
export function useToast(busOverride?: ToastBus): ToastApi {
  const bus = busOverride ?? inject<ToastBus | null>(toastKey, null)
  if (!bus) {
    throw new Error('[useToast] No ToastBus has been provided. Mount <ToastHost /> in App.vue.')
  }
  return {
    push: (message, variant) => bus.push(message, variant),
    dismiss: (id) => bus.dismiss(id),
  }
}
