<script setup lang="ts">
/**
 * `/pentatlon` route entrypoint. Internal state machine on `cursor + run`:
 *   select  → run === null
 *   run     → run !== null && cursor < 5  (EventStep)
 *   podium  → cursor === 5               (ClassificationPodium)
 *
 * Provides pentathlonStoreKey to subtree so EventStep and
 * ClassificationPodium don't need to import the store directly.
 */
import { computed, onMounted, provide } from 'vue'
import { useRouter } from 'vue-router'
import { useHeroesStore } from '@/features/heroes/store'
import { usePentathlonStore } from '../store'
import { pentathlonStoreKey } from '../types'
import PageHeader from '@/shared/ui/PageHeader.vue'
import Button from '@/shared/ui/Button.vue'
import HeroSelector from './HeroSelector.vue'
import EventStep from './EventStep.vue'
import ClassificationPodium from './ClassificationPodium.vue'
import { messages } from '@/shared/i18n/messages'

const heroesStore = useHeroesStore()
const pentathlonStore = usePentathlonStore()
const router = useRouter()

provide(pentathlonStoreKey, pentathlonStore)

onMounted(() => {
  if (heroesStore.status === 'idle') heroesStore.load()
})

type Phase = 'select' | 'run' | 'podium'

const phase = computed<Phase>(() => {
  if (!pentathlonStore.run) return 'select'
  if (pentathlonStore.cursor < 5) return 'run'
  return 'podium'
})
</script>

<template>
  <main class="max-w-content mx-auto px-s4 py-s5 md:px-s6 md:py-s6">
    <template v-if="phase === 'select'">
      <PageHeader
        :eyebrow="messages.pentathlon.pageEyebrow"
        :title="messages.pentathlon.pageTitle"
        :subtitle="messages.pentathlon.selectionInstruction"
        class="mb-s5"
      >
        <template #actions>
          <Button variant="ghost" @click="router.push('/heroes')">
            {{ messages.pentathlon.goToHeroesNavCta }}
          </Button>
        </template>
      </PageHeader>
      <HeroSelector />
    </template>

    <template v-else-if="phase === 'run'">
      <EventStep />
    </template>

    <template v-else>
      <ClassificationPodium />
    </template>
  </main>
</template>
