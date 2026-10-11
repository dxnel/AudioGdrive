<template>
  <div v-if="player.current.value">
    <!-- Barre de lecture -->
    <div class="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <!-- Fil de progression (mobile) -->
      <div class="md:hidden h-0.5 bg-white/10">
        <div class="h-full bg-white" :style="{ width: pct + '%' }"></div>
      </div>

      <div class="mx-auto max-w-[1400px] px-3 md:px-6 py-2 md:py-3 grid grid-cols-[1fr_auto] md:grid-cols-[1fr_minmax(320px,560px)_1fr] items-center gap-3 md:gap-6">
        <!-- Titre -->
        <button class="flex items-center gap-3 min-w-0 text-left md:cursor-default" @click="expanded = true" aria-label="Ouvrir le lecteur">
          <CoverArt :name="title" class="h-11 w-11 md:h-12 md:w-12" rounded="rounded-md" />
          <span class="min-w-0">
            <span class="block truncate text-sm font-medium">{{ title }}</span>
            <span class="block truncate text-xs text-mute">{{ player.playing.value ? 'En lecture' : 'En pause' }}</span>
          </span>
        </button>

        <!-- Contrôles + progression (desktop) -->
        <div class="hidden md:flex flex-col items-center gap-0.5">
          <div class="flex items-center gap-5">
            <button class="p-2 text-mute enabled:hover:text-white disabled:opacity-30 transition-colors" :disabled="!player.hasPrev.value" @click="player.prev()" aria-label="Précédent">
              <SkipBack :size="20" fill="currentColor" />
            </button>
            <button class="h-10 w-10 grid place-items-center rounded-full bg-white text-ink hover:scale-105 transition-transform" @click="toggle" :aria-label="player.playing.value ? 'Pause' : 'Lecture'">
              <Pause v-if="player.playing.value" :size="18" fill="currentColor" />
              <Play v-else :size="18" fill="currentColor" class="ml-0.5" />
            </button>
            <button class="p-2 text-mute enabled:hover:text-white disabled:opacity-30 transition-colors" :disabled="!player.hasNext.value" @click="player.next()" aria-label="Suivant">
              <SkipForward :size="20" fill="currentColor" />
            </button>
          </div>
          <div class="flex w-full items-center gap-3">
            <span class="w-10 text-right text-[11px] tabular-nums text-mute">{{ fmt(player.time.value) }}</span>
            <input type="range" min="0" max="1000" step="1" class="scrub" :value="pct * 10" :style="{ '--p': pct + '%' }" @input="onScrub" aria-label="Position de lecture" />
            <span class="w-10 text-[11px] tabular-nums text-mute">{{ fmt(player.duration.value) }}</span>
          </div>
        </div>

        <!-- Droite : fermer (desktop) / lecture + suivant (mobile) -->
        <div class="flex items-center justify-end gap-1">
          <button class="md:hidden h-11 w-11 grid place-items-center rounded-full text-white" @click="toggle" :aria-label="player.playing.value ? 'Pause' : 'Lecture'">
            <Pause v-if="player.playing.value" :size="24" fill="currentColor" />
            <Play v-else :size="24" fill="currentColor" />
          </button>
          <button class="md:hidden h-11 w-11 grid place-items-center text-mute disabled:opacity-30" :disabled="!player.hasNext.value" @click="player.next()" aria-label="Suivant">
            <SkipForward :size="22" fill="currentColor" />
          </button>
          <button class="hidden md:grid h-9 w-9 place-items-center rounded-full text-mute hover:bg-white/10 hover:text-white transition-colors" @click="player.stop()" aria-label="Fermer le lecteur">
            <X :size="18" />
          </button>
        </div>
      </div>
    </div>

    <!-- Lecteur plein écran (mobile) -->
    <Transition
      enter-active-class="transition-transform duration-300 ease-out motion-reduce:transition-none"
      leave-active-class="transition-transform duration-250 ease-in motion-reduce:transition-none"
      enter-from-class="translate-y-full"
      leave-to-class="translate-y-full"
    >
      <div v-if="expanded" class="md:hidden fixed inset-0 z-50 flex flex-col bg-ink px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div class="flex items-center justify-between">
          <button class="h-11 w-11 -ml-2 grid place-items-center text-mute" @click="expanded = false" aria-label="Réduire le lecteur">
            <ChevronDown :size="26" />
          </button>
          <BrandMark :size="22" :wordmark="false" />
          <button class="h-11 w-11 -mr-2 grid place-items-center text-mute" @click="closeAll" aria-label="Arrêter la lecture">
            <X :size="22" />
          </button>
        </div>

        <div class="flex-1 grid place-items-center py-4">
          <CoverArt :name="title" class="aspect-square w-[min(80vw,46dvh)]" rounded="rounded-2xl" />
        </div>

        <div>
          <h2 class="text-xl font-semibold leading-snug line-clamp-2">{{ title }}</h2>
          <p v-if="player.error.value" class="mt-2 text-sm text-red-400">{{ player.error.value }}</p>

          <div class="mt-5">
            <input type="range" min="0" max="1000" step="1" class="scrub scrub-lg" :value="pct * 10" :style="{ '--p': pct + '%' }" @input="onScrub" aria-label="Position de lecture" />
            <div class="mt-1 flex justify-between text-xs tabular-nums text-mute">
              <span>{{ fmt(player.time.value) }}</span>
              <span>{{ fmt(player.duration.value) }}</span>
            </div>
          </div>

          <div class="mt-4 flex items-center justify-center gap-8">
            <button class="h-14 w-14 grid place-items-center text-white disabled:opacity-30" :disabled="!player.hasPrev.value" @click="player.prev()" aria-label="Précédent">
              <SkipBack :size="30" fill="currentColor" />
            </button>
            <button class="h-[72px] w-[72px] grid place-items-center rounded-full bg-white text-ink active:scale-95 transition-transform" @click="toggle" :aria-label="player.playing.value ? 'Pause' : 'Lecture'">
              <Pause v-if="player.playing.value" :size="30" fill="currentColor" />
              <Play v-else :size="30" fill="currentColor" class="ml-1" />
            </button>
            <button class="h-14 w-14 grid place-items-center text-white disabled:opacity-30" :disabled="!player.hasNext.value" @click="player.next()" aria-label="Suivant">
              <SkipForward :size="30" fill="currentColor" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { Play, Pause, SkipBack, SkipForward, X, ChevronDown } from 'lucide-vue-next'

const player = useAudioPlayer()
const expanded = ref(false)

const title = computed(() => player.current.value?.title || '')
const pct = computed(() => player.duration.value > 0 ? (player.time.value / player.duration.value) * 100 : 0)

// Même logique que la liste : pause / reprise de la piste courante
const toggle = () => {
  const t = player.current.value
  if (t) player.toggle(t)
}
const onScrub = (e) => player.seek(Number(e.target.value) / 1000)
const closeAll = () => { expanded.value = false; player.stop() }

const fmt = (s) => {
  if (!s || isNaN(s) || !isFinite(s)) return '0:00'
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`
}

// Quand il n'y a plus de piste, on referme le plein écran
watch(() => player.currentId.value, (id) => { if (!id) expanded.value = false })
</script>
