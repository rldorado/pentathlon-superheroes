<script setup lang="ts">
/**
 * `/heroes` route entrypoint.
 *
 * Owns the page-level state machine:
 *   - On mount: kicks off `store.load()`.
 *   - Renders: PageHeader · loading skeletons · empty state · grid.
 *   - Hosts the create/edit dialog and the confirm-delete dialog, mediated
 *     by local `ref`s, and feeds the toast bus on success.
 *
 * Provides the heroes store down the subtree via `heroesStoreKey` so the
 * form and delete dialogs do not need to import the store directly.
 */
import { computed, onMounted, provide, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/shared/ui/PageHeader.vue'
import Button from '@/shared/ui/Button.vue'
import SkeletonCard from '@/shared/ui/SkeletonCard.vue'
import ErrorBlock from '@/shared/ui/ErrorBlock.vue'
import HeroGrid from './HeroGrid.vue'
import HeroFormDialog from './HeroFormDialog.vue'
import ConfirmDeleteDialog from './ConfirmDeleteDialog.vue'
import { useHeroesStore } from '../store'
import { heroesStoreKey } from '../types'
import { useToast } from '@/shared/ui/toast/useToast'
import { messages } from '@/shared/i18n/messages'
import type { Hero } from '../types'
import type { HeroFormMode } from '../composables/useHeroForm'

const store = useHeroesStore()
provide(heroesStoreKey, store)
const router = useRouter()
const toast = useToast()

onMounted(() => {
  if (store.status === 'idle') store.load()
})

const formOpen = ref(false)
const formMode = ref<HeroFormMode>('create')
const formInitial = ref<Hero | null>(null)

function openCreate(): void {
  formMode.value = 'create'
  formInitial.value = null
  formOpen.value = true
}

function openEdit(hero: Hero): void {
  formMode.value = 'edit'
  formInitial.value = hero
  formOpen.value = true
}

function onSubmitted(_hero: Hero, mode: HeroFormMode): void {
  toast.push(
    mode === 'create' ? messages.heroes.toasts.created : messages.heroes.toasts.updated,
    'success',
  )
}

const deleteOpen = ref(false)
const deleteHero = ref<Hero | null>(null)
const deletePending = ref(false)

function openDelete(hero: Hero): void {
  deleteHero.value = hero
  deleteOpen.value = true
}

async function onConfirmDelete(hero: Hero): Promise<void> {
  deletePending.value = true
  const ok = await store.remove(hero.id)
  deletePending.value = false
  if (ok) {
    deleteOpen.value = false
    deleteHero.value = null
    toast.push(messages.heroes.toasts.removed, 'success')
  }
  // On failure, store.error is populated; the dialog renders it inline.
}

const metaLine = computed(() => {
  if (store.count === 0) return messages.heroes.metaCountEmpty
  return store.count === 1
    ? `${store.count} ${messages.heroes.metaCountSingular}`
    : `${store.count} ${messages.heroes.metaCountPlural}`
})

const isLoading = computed(() => store.status === 'loading' || store.status === 'idle')
const isEmpty = computed(() => store.status === 'ready' && store.heroes.length === 0)
const isErrored = computed(() => store.status === 'error')
</script>

<template>
  <main class="max-w-content mx-auto px-s4 py-s5 md:px-s6 md:py-s6">
    <PageHeader
      :eyebrow="messages.heroes.pageEyebrow"
      :title="messages.heroes.pageTitle"
      :subtitle="metaLine"
      class="mb-s5"
    >
      <template #actions>
        <Button variant="ghost" @click="router.push('/pentatlon')">
          {{ messages.heroes.goToPentathlonCta }}
        </Button>
        <Button variant="primary" @click="openCreate">
          <span class="font-mono font-bold text-h3 w-4 text-center" aria-hidden="true">+</span>
          {{ messages.heroes.inscribeCta }}
        </Button>
      </template>
    </PageHeader>

    <section v-if="isLoading" aria-busy="true" aria-live="polite">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-s4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </section>

    <ErrorBlock
      v-else-if="isErrored"
      :message="store.error ?? messages.errors.generic"
      @retry="store.load()"
    />

    <section
      v-else-if="isEmpty"
      class="border border-dashed border-hairline rounded-md p-s6 text-center"
    >
      <p class="font-body text-body text-ink-2 m-0 mb-s3">
        {{ messages.heroes.empty.rosterEmpty }}
      </p>
      <Button variant="primary" @click="openCreate">
        {{ messages.heroes.inscribeCta }}
      </Button>
    </section>

    <HeroGrid
      v-else
      :heroes="store.heroes"
      @edit="openEdit"
      @remove="openDelete"
      @inscribe="openCreate"
    />

    <HeroFormDialog
      v-if="formInitial"
      :open="formOpen"
      :mode="formMode"
      :initial="formInitial"
      @update:open="(v) => (formOpen = v)"
      @submitted="onSubmitted"
    />
    <HeroFormDialog
      v-else
      :open="formOpen"
      :mode="formMode"
      @update:open="(v) => (formOpen = v)"
      @submitted="onSubmitted"
    />

    <ConfirmDeleteDialog
      :open="deleteOpen"
      :hero="deleteHero"
      :error="store.error ?? ''"
      :pending="deletePending"
      @update:open="(v) => (deleteOpen = v)"
      @confirm="onConfirmDelete"
    />
  </main>
</template>
