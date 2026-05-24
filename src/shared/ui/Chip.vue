<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'default' | 'gold' | 'silver' | 'bronze' | 'accent'

const props = withDefaults(defineProps<{ variant?: Variant }>(), { variant: 'default' })

const byVariant: Record<Variant, string[]> = {
  default: ['bg-canvas-2', 'text-ink'],
  gold: ['bg-gold', 'text-gold-ink'],
  silver: ['bg-silver', 'text-silver-ink'],
  bronze: ['bg-bronze', 'text-bronze-ink'],
  accent: ['bg-accent', 'text-accent-ink'],
}

const classList = computed(() => [
  'inline-flex items-center gap-s1',
  'rounded-pill px-s3 py-s1',
  'font-body font-semibold text-caption uppercase tracking-[0.04em]',
  ...byVariant[props.variant],
])
</script>

<template>
  <span :class="classList">
    <slot />
  </span>
</template>
