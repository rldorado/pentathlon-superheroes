<script setup lang="ts">
/**
 * Inline error block — Spanish error message + optional Retry callback.
 * Used by HeroesPage and HeroSelector when a fetch/API call fails.
 * Renders `role="alert"` so screen readers announce the message.
 */
import Button from './Button.vue'
import { messages } from '@/shared/i18n/messages'

interface Props {
  message: string
  retryLabel?: string
}

withDefaults(defineProps<Props>(), {
  retryLabel: messages.actions.retry,
})

defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="flex flex-col items-start gap-s3">
    <p role="alert" class="font-body text-body text-accent-strong m-0">
      {{ message }}
    </p>
    <Button variant="ghost" @click="$emit('retry')">{{ retryLabel }}</Button>
  </div>
</template>
