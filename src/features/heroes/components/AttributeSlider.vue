<script setup lang="ts">
/**
 * Integer 0..10 slider with a JetBrains Mono numeric readout. Uses the
 * native `<input type="range">` so keyboard arrow keys, Home/End, and Page
 * Up/Down all step correctly without custom logic. The visible track is the
 * native control styled via Tailwind utilities; we keep `tabular-nums` on
 * the readout for column alignment per constitution §6.3.
 */

import { computed } from 'vue'

interface Props {
  /** Spanish label rendered next to the slider (e.g. "Agilidad"). */
  label: string
  /** Current integer value (0..10). */
  modelValue: number
  /** Optional id; auto-generated otherwise to associate label + input. */
  id?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const inputId = computed(() => props.id ?? `attr-${props.label.toLowerCase().replace(/\s+/g, '-')}`)

function onInput(event: Event): void {
  const target = event.target as HTMLInputElement
  const next = Number.parseInt(target.value, 10)
  if (Number.isFinite(next)) emit('update:modelValue', next)
}
</script>

<template>
  <div class="grid grid-cols-[78px_1fr_28px] items-center gap-3">
    <label :for="inputId" class="font-body text-caption font-medium text-ink-2 whitespace-nowrap">
      {{ label }}
    </label>
    <input
      :id="inputId"
      type="range"
      min="0"
      max="10"
      step="1"
      :value="modelValue"
      :aria-valuemin="0"
      :aria-valuemax="10"
      :aria-valuenow="modelValue"
      class="h-11 w-full cursor-pointer accent-accent"
      @input="onInput"
    />
    <span
      class="font-mono text-body-sm font-bold text-ink tabular-nums text-right"
      aria-hidden="true"
    >
      {{ modelValue }}
    </span>
  </div>
</template>
