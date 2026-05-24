import type { InjectionKey, Ref } from 'vue'

/**
 * Toast subsystem types and the canonical InjectionKey.
 *
 * Per docs/plan.md §4.3, `App.vue` is the provider for `toastKey`, and any
 * component anywhere in the tree can call `useToast()` to obtain the bus.
 * Keeping this file logic-free (per docs/constitution.md §6 — data only)
 * means it never needs a test of its own.
 */

export type ToastVariant = 'info' | 'success' | 'error'

export interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

export interface ToastBus {
  /** Read-only reactive queue, exposed so `ToastHost` can render it. */
  readonly toasts: Readonly<Ref<readonly ToastItem[]>>
  /** Enqueue a new toast. Returns the generated id. */
  push(message: string, variant?: ToastVariant): string
  /** Remove a toast by id (no-op if it has already auto-dismissed). */
  dismiss(id: string): void
  /** Auto-dismiss delay in ms. Exposed for test-time tweaking; default 3000. */
  readonly autoDismissMs: number
}

export const toastKey: InjectionKey<ToastBus> = Symbol('toastKey')
