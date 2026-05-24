<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Attribute value on the canonical 0..10 scale. Clamped defensively. */
    value: number
    /** Optional Spanish label, e.g. "Fuerza". Generates aria-label "Fuerza: N sobre 10". */
    label?: string
  }>(),
  { label: '' },
)

const clamped = computed(() => Math.max(0, Math.min(10, Math.round(props.value))))
const widthPct = computed(() => `${clamped.value * 10}%`)

const ariaLabel = computed(() =>
  props.label ? `${props.label}: ${clamped.value} sobre 10` : undefined,
)
</script>

<template>
  <div
    role="progressbar"
    :aria-valuemin="0"
    :aria-valuemax="10"
    :aria-valuenow="clamped"
    :aria-label="ariaLabel"
    class="relative h-1 w-full bg-canvas-2 rounded-pill overflow-hidden"
  >
    <span data-fill class="block h-full bg-accent rounded-pill" :style="{ width: widthPct }" />
  </div>
</template>
