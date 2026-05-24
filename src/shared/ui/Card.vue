<script setup lang="ts">
withDefaults(
  defineProps<{
    as?: 'article' | 'section' | 'div' | 'li'
  }>(),
  { as: 'article' },
)
</script>

<template>
  <component :is="as" class="bg-canvas border border-hairline rounded-md overflow-hidden">
    <slot />
  </component>
</template>
