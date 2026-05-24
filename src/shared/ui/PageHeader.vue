<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  subtitle?: string
}>()
</script>

<template>
  <header
    class="flex flex-col gap-s3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-s4"
  >
    <div class="min-w-0 flex flex-col gap-s2">
      <p
        data-eyebrow
        class="inline-flex items-center gap-s2 font-body font-semibold text-eyebrow uppercase text-ink-2 before:content-[''] before:block before:h-[2px] before:w-6 before:bg-accent"
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
    <div
      v-if="$slots.actions"
      data-actions
      class="flex flex-col gap-s2 w-full sm:flex-row sm:flex-wrap sm:w-auto sm:flex-shrink-0 sm:items-center sm:justify-end"
    >
      <slot name="actions" />
    </div>
  </header>
</template>
