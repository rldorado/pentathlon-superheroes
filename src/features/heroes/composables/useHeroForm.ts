/**
 * `useHeroForm` — composable that owns the hero form state for both
 * `create` and `edit` modes.
 *
 * Responsibilities:
 *   - Hold the reactive draft (`name`, `picture`, `attributes`).
 *   - Run validation via the pure validators in `./validators.ts`.
 *   - Expose `errors` (a reactive map keyed by field) and `submitting`.
 *   - Submit by calling the injected store action; surface API errors via
 *     `submitError` (mapped Spanish copy already provided by the store).
 *
 * The store is passed as an argument (rather than imported inside) so the
 * composable can be tested via `renderComposable` with a mock store and to
 * keep this layer decoupled from Pinia internals.
 */

import { reactive, ref, computed } from 'vue'
import type { Hero, HeroAttributes, HeroInput } from '../types'
import { validateAttributes, validateName, validatePicture } from './validators'

export type HeroFormMode = 'create' | 'edit'

/** Minimal store surface this composable needs — typed for easy mocking. */
export interface HeroFormStore {
  hasName: (name: string, exceptId?: string) => boolean
  create: (input: HeroInput) => Promise<Hero | null>
  update: (id: string, input: HeroInput) => Promise<Hero | null>
  /** Latest mapped Spanish error string, if any. */
  error: string | null
}

export interface HeroFormErrors {
  name?: string
  picture?: string
  attributes?: Partial<Record<keyof HeroAttributes, string>>
}

export interface UseHeroFormOptions {
  mode: HeroFormMode
  /** Required when `mode === 'edit'`. Pre-fills draft + sets exceptId. */
  initial?: Hero
  store: HeroFormStore
}

export interface UseHeroFormReturn {
  draft: { name: string; picture: string; attributes: HeroAttributes }
  errors: HeroFormErrors
  submitting: { value: boolean }
  submitError: { value: string | null }
  isValid: { value: boolean }
  /** Runs validation, mutating `errors`. Returns `true` when no errors. */
  validate: () => boolean
  /** Validates, then calls store create/update. Returns `{ ok }`. */
  submit: () => Promise<{ ok: boolean; hero: Hero | null }>
  /** Resets draft + errors to initial state. */
  reset: () => void
}

const DEFAULT_ATTRIBUTES: HeroAttributes = {
  agility: 5,
  strength: 5,
  weight: 5,
  endurance: 5,
  charisma: 5,
}

export function useHeroForm(options: UseHeroFormOptions): UseHeroFormReturn {
  const { mode, initial, store } = options
  if (mode === 'edit' && !initial) {
    throw new Error('useHeroForm: edit mode requires `initial` hero')
  }

  const draft = reactive({
    name: initial?.name ?? '',
    picture: initial?.picture ?? '',
    attributes: { ...DEFAULT_ATTRIBUTES, ...(initial?.attributes ?? {}) },
  })

  const errors = reactive<HeroFormErrors>({})
  const submitting = ref(false)
  const submitError = ref<string | null>(null)

  function clearErrors(): void {
    delete errors.name
    delete errors.picture
    delete errors.attributes
  }

  function validate(): boolean {
    clearErrors()
    const nameErr = validateName(draft.name, {
      isTaken: (trimmed) => store.hasName(trimmed, initial?.id),
    })
    if (nameErr) errors.name = nameErr

    const pictureErr = validatePicture(draft.picture || undefined, mode)
    if (pictureErr) errors.picture = pictureErr

    const attrsErrs = validateAttributes(draft.attributes)
    if (Object.keys(attrsErrs).length > 0) errors.attributes = attrsErrs

    return !errors.name && !errors.picture && !errors.attributes
  }

  const isValid = computed(
    () =>
      !errors.name &&
      !errors.picture &&
      (!errors.attributes || Object.keys(errors.attributes).length === 0),
  )

  async function submit(): Promise<{ ok: boolean; hero: Hero | null }> {
    if (!validate()) return { ok: false, hero: null }

    submitting.value = true
    submitError.value = null
    try {
      const input: HeroInput = {
        name: draft.name.trim(),
        attributes: { ...draft.attributes },
      }
      if (draft.picture) input.picture = draft.picture

      const result =
        mode === 'create' ? await store.create(input) : await store.update(initial!.id, input)

      if (!result) {
        submitError.value = store.error
        return { ok: false, hero: null }
      }
      return { ok: true, hero: result }
    } finally {
      submitting.value = false
    }
  }

  function reset(): void {
    draft.name = initial?.name ?? ''
    draft.picture = initial?.picture ?? ''
    Object.assign(draft.attributes, DEFAULT_ATTRIBUTES, initial?.attributes ?? {})
    clearErrors()
    submitError.value = null
    submitting.value = false
  }

  return {
    draft,
    errors,
    submitting,
    submitError,
    isValid,
    validate,
    submit,
    reset,
  }
}
