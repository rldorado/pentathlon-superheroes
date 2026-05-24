<script setup lang="ts">
/**
 * File input for the hero portrait. Accepts PNG/JPEG, validates the file
 * against constitution + clarification constraints (MIME, ≤ 200 KB,
 * 128×128 intrinsic dimensions), and emits the prefix-stripped base64
 * string ready for `HeroInput.picture`.
 *
 * Pure validation lives in `./heroImage.ts` so the SFC only handles UI
 * state and event wiring.
 */

import { computed, ref } from 'vue'
import { messages } from '@/shared/i18n/messages'
import { processHeroImage, toDataUrl } from './heroImage'

interface Props {
  /** Current base64 picture (no data-url prefix). */
  modelValue?: string
  /** External error (e.g. validation message from useHeroForm). */
  error?: string
  /** Optional id; used to associate the file input + label. */
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  error: '',
  id: 'hero-image-input',
})
const emit = defineEmits<{
  'update:modelValue': [base64: string]
  'update:error': [error: string]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const busy = ref(false)
const inputId = computed(() => props.id)

const previewSrc = computed(() => (props.modelValue ? toDataUrl(props.modelValue) : null))

async function onChange(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  // Reset the native input so picking the same file twice triggers change
  // again — important when correcting a validation error.
  target.value = ''
  if (!file) return

  busy.value = true
  emit('update:error', '')
  try {
    const result = await processHeroImage(file)
    if (!result.ok) {
      emit('update:error', result.error)
      return
    }
    emit('update:modelValue', result.base64)
  } finally {
    busy.value = false
  }
}

function pick(): void {
  inputRef.value?.click()
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center gap-4">
      <div
        class="w-32 h-32 rounded-thumb overflow-hidden bg-canvas-2 border border-hairline shrink-0"
        aria-hidden="true"
      >
        <img
          v-if="previewSrc"
          :src="previewSrc"
          width="128"
          height="128"
          class="w-full h-full object-cover"
          alt=""
        />
      </div>

      <div class="flex flex-col gap-2">
        <p class="font-body text-caption text-ink-2">{{ messages.heroes.form.pictureHint }}</p>
        <button
          type="button"
          :disabled="busy"
          class="self-start min-h-[44px] px-4 py-2 rounded-md border border-hairline bg-canvas hover:border-ink font-body font-semibold text-body-sm text-ink disabled:opacity-60 disabled:cursor-not-allowed"
          @click="pick"
        >
          {{ modelValue ? messages.heroes.form.pictureChangeCta : messages.heroes.form.pictureCta }}
        </button>
        <input
          :id="inputId"
          ref="inputRef"
          type="file"
          accept="image/png,image/jpeg"
          class="sr-only"
          :aria-describedby="error ? `${inputId}-error` : undefined"
          :aria-invalid="error ? 'true' : 'false'"
          @change="onChange"
        />
      </div>
    </div>

    <p
      v-if="error"
      :id="`${inputId}-error`"
      class="font-body text-caption text-accent-strong"
      role="alert"
    >
      {{ error }}
    </p>
  </div>
</template>
