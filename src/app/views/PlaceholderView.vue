<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <main class="mx-auto max-w-content px-s4 py-s7">
    <p class="font-body text-eyebrow uppercase tracking-[0.08em] text-ink-2">Pentatlón</p>
    <h1 class="mt-s3 font-display text-display-l text-ink">{{ title }}</h1>
    <p v-if="subtitle" class="mt-s3 text-body text-ink-2">{{ subtitle }}</p>

    <!-- Theme smoke check (T-03 AC): bg-accent + text-accent-ink, mono numerals -->
    <div
      class="mt-s6 inline-flex items-center gap-s3 rounded-md bg-accent px-s4 py-s3 text-accent-ink"
    >
      <span class="font-body text-h4 font-semibold">Tema cargado</span>
      <span class="font-mono text-h4 font-bold">0123456789</span>
    </div>

    <nav class="mt-s5 flex gap-s4 font-body text-body-sm">
      <RouterLink
        to="/heroes"
        class="underline decoration-1 underline-offset-4 hover:text-accent-strong"
      >
        /heroes
      </RouterLink>
      <RouterLink
        to="/pentatlon"
        class="underline decoration-1 underline-offset-4 hover:text-accent-strong"
      >
        /pentatlon
      </RouterLink>
    </nav>
  </main>
</template>
