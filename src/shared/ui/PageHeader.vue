<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  subtitle?: string
}>()
</script>

<template>
  <header class="flex flex-wrap items-end justify-between gap-s4">
    <div class="min-w-0 flex flex-col gap-s2">
      <p
        data-eyebrow
        class="
          inline-flex items-center gap-s2
          font-body font-semibold text-eyebrow uppercase text-ink-2
          before:content-[''] before:block before:h-[2px] before:w-6 before:bg-accent
        "
      >
        {{ eyebrow }}
      </p>
      <h1 class="font-display font-bold text-display-l text-ink">
        {{ title }}
      </h1>
      <p v-if="subtitle" data-subtitle class="font-body text-body text-ink-2">
        {{ subtitle }}
      </p>
    </div>
    <div v-if="$slots.actions" class="flex-shrink-0">
      <slot name="actions" />
    </div>
  </header>
</template>
