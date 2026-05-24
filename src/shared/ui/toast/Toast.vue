<script setup lang="ts">
import { computed } from 'vue'
import { messages } from '@/shared/i18n/messages'
import type { ToastItem } from './types'

const props = defineProps<{
  toast: ToastItem
}>()

const emit = defineEmits<{
  dismiss: [id: string]
}>()

const variantClasses = computed<string[]>(() => {
  switch (props.toast.variant) {
    case 'success':
      return ['bg-canvas', 'text-ink', 'border-accent']
    case 'error':
      return ['bg-canvas', 'text-ink', 'border-accent-strong']
    default:
      return ['bg-canvas', 'text-ink', 'border-hairline']
  }
})
</script>

<template>
  <div
    role="status"
    aria-live="polite"
    :class="[
      'flex items-start gap-s3 min-w-[260px] max-w-sm',
      'rounded-md border-l-4 border border-hairline',
      'px-s4 py-s3 font-body text-body-sm',
      ...variantClasses,
    ]"
  >
    <p class="m-0 flex-1">{{ toast.message }}</p>
    <button
      type="button"
      :aria-label="messages.a11y.toastDismissLabel"
      class="-m-s1 inline-flex items-center justify-center w-8 h-8 rounded-md text-ink-3 hover:bg-canvas-2 hover:text-ink transition-colors duration-base ease-pa"
      @click="emit('dismiss', toast.id)"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="square"
        aria-hidden="true"
      >
        <line x1="3" y1="3" x2="13" y2="13" />
        <line x1="13" y1="3" x2="3" y2="13" />
      </svg>
    </button>
  </div>
</template>
