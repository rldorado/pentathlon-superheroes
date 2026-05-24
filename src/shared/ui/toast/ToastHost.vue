<script setup lang="ts">
import { inject } from 'vue'
import { messages } from '@/shared/i18n/messages'
import Toast from './Toast.vue'
import { toastKey, type ToastBus } from './types'

/**
 * Single host for the toast queue. Mounted once near the bottom of
 * `App.vue`. Reads the bus injected by `App.vue` (see docs/plan.md §4.3)
 * and renders each toast in a fixed bottom-right column.
 */
const bus = inject<ToastBus | null>(toastKey, null)
if (!bus) {
  throw new Error(
    '[ToastHost] No ToastBus has been provided. Provide `toastKey` in App.vue before mounting <ToastHost />.',
  )
}

function onDismiss(id: string): void {
  bus!.dismiss(id)
}
</script>

<template>
  <div
    :aria-label="messages.a11y.toastRegionLabel"
    class="fixed bottom-s4 right-s4 z-40 flex flex-col gap-s2 items-end pointer-events-none"
  >
    <div v-for="t in bus.toasts.value" :key="t.id" class="pointer-events-auto">
      <Toast :toast="t" @dismiss="onDismiss" />
    </div>
  </div>
</template>
