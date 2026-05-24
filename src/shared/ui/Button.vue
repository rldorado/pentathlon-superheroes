<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'primary' | 'ghost' | 'danger'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
  }>(),
  {
    variant: 'primary',
    type: 'button',
    disabled: false,
  },
)

const base = [
  'inline-flex items-center justify-center gap-s2',
  'font-body font-semibold text-body',
  'rounded-md px-s4 py-s2 min-h-11',
  'transition-colors duration-base ease-pa',
  'disabled:opacity-50 disabled:cursor-not-allowed',
]

const byVariant: Record<Variant, string[]> = {
  primary: ['bg-accent', 'text-accent-ink', 'hover:bg-accent-strong', 'hover:text-white'],
  ghost: ['bg-transparent', 'text-ink', 'hover:bg-canvas-2'],
  danger: ['bg-accent-strong', 'text-white', 'hover:bg-accent'],
}

const classList = computed(() => [...base, ...byVariant[props.variant]])
</script>

<template>
  <button :type="type" :disabled="disabled" :class="classList">
    <slot />
  </button>
</template>
