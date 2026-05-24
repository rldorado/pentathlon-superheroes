<script setup lang="ts">
/**
 * Placeholder card shown at the trailing edge of a partial roster row, per
 * design-reference/Heroes Inscritos.html. CTA emits `inscribe` so the page
 * can open the create-form dialog.
 */
import { computed, useAttrs } from 'vue'
import { messages } from '@/shared/i18n/messages'

defineEmits<{ inscribe: [] }>()

const attrs = useAttrs()
const ariaLabel = computed(() =>
  typeof attrs['aria-label'] === 'string' ? attrs['aria-label'] : 'Espacio vacío en la plantilla',
)
</script>

<template>
  <article
    class="card-empty flex flex-col items-center justify-center text-center border border-dashed border-hairline bg-transparent rounded-md p-10 min-h-full"
    :aria-label="ariaLabel"
  >
    <div
      class="w-14 h-14 border border-dashed border-ink-3 text-ink-3 flex items-center justify-center mb-4"
      aria-hidden="true"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="square"
        stroke-linejoin="miter"
      >
        <line x1="11" y1="4" x2="11" y2="18" />
        <line x1="4" y1="11" x2="18" y2="11" />
      </svg>
    </div>
    <p class="font-body text-body-sm text-ink-2 whitespace-pre-line">{{ messages.heroes.empty.slot }}</p>
    <button
      type="button"
      class="mt-3 min-h-9 px-1 py-1 font-body font-semibold text-body-sm text-ink underline underline-offset-4 hover:text-accent-strong"
      @click="$emit('inscribe')"
    >
      {{ messages.heroes.empty.slotCta }}
    </button>
  </article>
</template>
