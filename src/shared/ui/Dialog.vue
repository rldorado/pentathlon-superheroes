<script setup lang="ts">
import { nextTick, ref, useId, watch } from 'vue'
import { messages } from '@/shared/i18n/messages'

/**
 * Accessible modal dialog per T-16.
 *
 * Contract:
 *   - `open` is the controlled state; emit `update:open` to close.
 *   - Renders to `<body>` via Teleport when open.
 *   - Esc, close button, and backdrop click all dismiss (backdrop dismissal
 *     can be opted out with `dismissOnBackdrop = false`).
 *   - Focus is moved inside the dialog on open and returned to the opener
 *     on close.
 *   - Body scroll is locked while open.
 */
const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    dismissOnBackdrop?: boolean
  }>(),
  { dismissOnBackdrop: true },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const headingId = useId()
const dialogRef = ref<HTMLElement | null>(null)
const opener = ref<HTMLElement | null>(null)

function close() {
  emit('update:open', false)
}

function onBackdropClick() {
  if (props.dismissOnBackdrop) close()
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

function getFocusable(): HTMLElement[] {
  if (!dialogRef.value) return []
  return Array.from(dialogRef.value.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('aria-hidden') && el.offsetParent !== null,
  )
}

function trapFocus(event: KeyboardEvent) {
  const items = getFocusable()
  if (items.length === 0) {
    event.preventDefault()
    dialogRef.value?.focus()
    return
  }
  const first = items[0]!
  const last = items[items.length - 1]!
  const active = document.activeElement as HTMLElement | null
  if (event.shiftKey) {
    if (active === first || !dialogRef.value?.contains(active)) {
      event.preventDefault()
      last.focus()
    }
  } else if (active === last) {
    event.preventDefault()
    first.focus()
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key === 'Tab') trapFocus(event)
}

watch(
  () => props.open,
  async (isOpen, wasOpen) => {
    if (isOpen && !wasOpen) {
      opener.value = (document.activeElement as HTMLElement | null) ?? null
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      const items = getFocusable()
      ;(items[0] ?? dialogRef.value)?.focus()
    } else if (!isOpen && wasOpen) {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeydown)
      await nextTick()
      opener.value?.focus()
      opener.value = null
    }
  },
  { immediate: true },
)

import { onBeforeUnmount } from 'vue'
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  if (props.open) document.body.style.overflow = ''
})
</script>

<template>
  <Teleport v-if="open" to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-s4">
      <div
        data-dialog-backdrop
        class="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        @click="onBackdropClick"
      />
      <div
        ref="dialogRef"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="headingId"
        tabindex="-1"
        class="relative w-full max-w-lg bg-canvas rounded-md border border-hairline shadow-none p-s5 max-h-[90vh] overflow-y-auto focus:outline-none"
      >
        <header class="flex items-start justify-between gap-s3 mb-s4">
          <h2 :id="headingId" class="font-display font-semibold text-h2 text-ink m-0">
            {{ title }}
          </h2>
          <button
            type="button"
            data-dialog-close
            :aria-label="messages.a11y.dialogCloseLabel"
            class="inline-flex items-center justify-center w-11 h-11 -m-s2 rounded-md bg-transparent text-ink-2 hover:bg-canvas-2 hover:text-ink transition-colors duration-base ease-pa"
            @click="close"
          >
            <svg
              width="16"
              height="16"
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
        </header>
        <slot />
      </div>
    </div>
  </Teleport>
</template>
