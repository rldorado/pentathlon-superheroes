<script setup lang="ts">
/**
 * Confirmation dialog for hero deletion. Owns no state of its own — it
 * delegates the API call to the parent (or to an injected store via
 * `heroesStoreKey`) so this component stays simple and easy to test.
 *
 * Emits:
 *   - `update:open` — close the dialog (forwarded from `Dialog`).
 *   - `confirm` — the user clicked the destructive CTA. Parent runs the
 *     `store.remove(...)` flow and closes the dialog on completion.
 */
import { ref } from 'vue'
import Dialog from '@/shared/ui/Dialog.vue'
import Button from '@/shared/ui/Button.vue'
import { messages } from '@/shared/i18n/messages'
import type { Hero } from '../types'

interface Props {
  open: boolean
  hero: Hero | null
  /** Optional inline error rendered above the actions (mapped Spanish). */
  error?: string
  /** Disables the destructive CTA while the parent's remove call is in flight. */
  pending?: boolean
}

const props = withDefaults(defineProps<Props>(), { error: '', pending: false })
const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: [hero: Hero]
}>()

const localPending = ref(false)

function onConfirm(): void {
  if (!props.hero || props.pending || localPending.value) return
  localPending.value = true
  emit('confirm', props.hero)
  // The parent owns the async flow + closes the dialog. We reset
  // `localPending` when the dialog actually closes.
}

function onUpdateOpen(value: boolean): void {
  if (!value) localPending.value = false
  emit('update:open', value)
}
</script>

<template>
  <Dialog
    :open="open"
    :title="messages.heroes.delete.title"
    @update:open="onUpdateOpen"
  >
    <p v-if="hero" class="font-body text-body text-ink m-0 mb-s4">
      {{ messages.heroes.delete.bodyPrefix }} <strong>{{ hero.name }}</strong>{{ messages.heroes.delete.bodySuffix }}
    </p>
    <p
      v-if="error"
      role="alert"
      class="font-body text-body-sm text-accent-strong mb-s4"
    >
      {{ error }}
    </p>
    <div class="flex justify-end gap-s2">
      <Button variant="ghost" :disabled="!!pending" @click="onUpdateOpen(false)">
        {{ messages.actions.cancel }}
      </Button>
      <Button
        variant="danger"
        :disabled="!!pending || !hero"
        @click="onConfirm"
      >
        {{ messages.heroes.delete.submit }}
      </Button>
    </div>
  </Dialog>
</template>
