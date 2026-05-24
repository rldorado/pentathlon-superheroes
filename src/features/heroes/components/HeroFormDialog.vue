<script setup lang="ts">
/**
 * Hero create/edit form wrapped in a Dialog.
 *
 * Modes:
 *   - `create` — empty draft, default attribute 5s, picture required.
 *   - `edit` — pre-fills from `initial`, picture optional (existing kept).
 *
 * The store is injected via `heroesStoreKey` (provided by `HeroesPage`)
 * so this component can be tested in isolation with a mock store.
 *
 * Lifecycle:
 *   - When the dialog opens, `useHeroForm` is (re-)created so each open
 *     starts from a fresh draft (or fresh edit prefill).
 *   - On submit success, the dialog closes and emits `submitted` so the
 *     parent can fire the appropriate toast.
 */
import { computed, inject, shallowRef, watch } from 'vue'
import Dialog from '@/shared/ui/Dialog.vue'
import Button from '@/shared/ui/Button.vue'
import HeroImageInput from './HeroImageInput.vue'
import AttributeSlider from './AttributeSlider.vue'
import { useHeroForm, type HeroFormMode, type HeroFormStore } from '../composables/useHeroForm'
import { heroesStoreKey } from '../types'
import { messages } from '@/shared/i18n/messages'
import type { Hero, HeroAttributes } from '../types'

interface Props {
  open: boolean
  mode: HeroFormMode
  /** Required when mode === 'edit'; used to prefill the draft. */
  initial?: Hero
  /** Override the store (testing hook). Production gets it via inject(). */
  storeOverride?: HeroFormStore
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  submitted: [hero: Hero, mode: HeroFormMode]
}>()

const injectedStore = inject(heroesStoreKey, null) as HeroFormStore | null
const store = computed<HeroFormStore>(() => {
  const s = props.storeOverride ?? injectedStore
  if (!s) {
    throw new Error('[HeroFormDialog] No heroes store provided. Mount inside HeroesPage.')
  }
  return s
})

// `shallowRef` (not `ref`) is critical — wrapping the useHeroForm return
// inside a plain `ref` would make Vue auto-unwrap the internal `submitting`,
// `submitError`, and `isValid` refs, breaking `.value` reads in the template.
// `shallowRef` keeps the object identity intact while still being swappable.
const form = shallowRef(makeForm())

function makeForm(): ReturnType<typeof useHeroForm> {
  // `exactOptionalPropertyTypes` rejects passing `initial: undefined`, so we
  // only spread the key when it has a value.
  const options = {
    mode: props.mode,
    store: store.value,
    ...(props.initial ? { initial: props.initial } : {}),
  } as const
  return useHeroForm(options)
}

// Re-create the form every time the dialog opens so each session starts
// fresh. Doing this on `open` (rather than on mode/initial change) keeps
// in-flight edits stable while the modal is showing.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) form.value = makeForm()
  },
)

const title = computed(() =>
  props.mode === 'create' ? messages.heroes.form.titleCreate : messages.heroes.form.titleEdit,
)

const submitLabel = computed(() =>
  props.mode === 'create' ? messages.heroes.form.submitCreate : messages.heroes.form.submitEdit,
)

const attributeKeys: Array<keyof HeroAttributes> = [
  'agility',
  'strength',
  'weight',
  'endurance',
  'charisma',
]

const attributeLabels: Record<keyof HeroAttributes, string> = {
  agility: messages.attributes.agility,
  strength: messages.attributes.strength,
  weight: messages.attributes.weight,
  endurance: messages.attributes.endurance,
  charisma: messages.attributes.charisma,
}

async function onSubmit(event: Event): Promise<void> {
  event.preventDefault()
  const result = await form.value.submit()
  if (result.ok && result.hero) {
    emit('submitted', result.hero, props.mode)
    emit('update:open', false)
  }
}
</script>

<template>
  <Dialog :open="open" :title="title" @update:open="(v) => emit('update:open', v)">
    <form class="flex flex-col gap-s4" novalidate @submit="onSubmit">
      <div class="flex flex-col gap-s2">
        <label for="hero-name" class="font-body text-body-sm font-semibold text-ink">{{
          messages.heroes.form.nameLabel
        }}</label>
        <input
          id="hero-name"
          v-model="form.draft.name"
          type="text"
          autocomplete="off"
          maxlength="40"
          :placeholder="messages.heroes.form.namePlaceholder"
          :aria-invalid="form.errors.name ? 'true' : 'false'"
          :aria-describedby="form.errors.name ? 'hero-name-error' : undefined"
          class="min-h-11 px-3 py-2 bg-canvas border border-hairline rounded-md font-body text-body text-ink focus:outline-none focus:border-ink"
        />
        <p
          v-if="form.errors.name"
          id="hero-name-error"
          role="alert"
          class="font-body text-caption text-accent-strong m-0"
        >
          {{ form.errors.name }}
        </p>
      </div>

      <div class="flex flex-col gap-s2">
        <span class="font-body text-body-sm font-semibold text-ink">{{
          messages.heroes.form.pictureLabel
        }}</span>
        <HeroImageInput
          v-model="form.draft.picture"
          :error="form.errors.picture ?? ''"
          @update:error="(e: string) => {
            if (e) form.errors.picture = e
            else delete form.errors.picture
          }"
        />
      </div>

      <fieldset class="flex flex-col gap-s3 border-0 p-0 m-0">
        <legend class="font-body text-body-sm font-semibold text-ink p-0 mb-s2">
          {{ messages.heroes.form.attributesLegend }}
        </legend>
        <AttributeSlider
          v-for="key in attributeKeys"
          :key="key"
          :label="attributeLabels[key]"
          :model-value="form.draft.attributes[key]"
          @update:model-value="(v: number) => (form.draft.attributes[key] = v)"
        />
      </fieldset>

      <p
        v-if="form.submitError.value"
        role="alert"
        class="font-body text-body-sm text-accent-strong m-0"
      >
        {{ form.submitError.value }}
      </p>

      <div class="flex justify-end gap-s2 mt-s2">
        <Button variant="ghost" :disabled="form.submitting.value" @click="$emit('update:open', false)">
          {{ messages.actions.cancel }}
        </Button>
        <Button type="submit" variant="primary" :disabled="form.submitting.value">
          {{ submitLabel }}
        </Button>
      </div>
    </form>
  </Dialog>
</template>
