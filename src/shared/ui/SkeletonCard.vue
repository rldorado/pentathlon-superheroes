<script setup lang="ts">
/**
 * Placeholder card used during `heroes` load. Pulse is gated by Tailwind's
 * `motion-safe:` variant so users with `prefers-reduced-motion: reduce`
 * see a static block. Global styles.css §"prefers-reduced-motion" is a
 * second line of defence.
 */
</script>

<template>
  <div
    aria-hidden="true"
    class="border border-hairline rounded-md bg-canvas-2 motion-safe:animate-pulse h-72"
  >
    <div class="aspect-square bg-hairline" />
    <div class="p-s4 space-y-s2">
      <div class="h-4 w-2/3 bg-hairline rounded-sm" />
      <div class="h-3 w-1/2 bg-hairline rounded-sm" />
      <div class="h-3 w-3/4 bg-hairline rounded-sm" />
    </div>
  </div>
</template>
