<template>
  <div class="md:grid md:grid-cols-[264px_minmax(0,1fr)] md:gap-10">
    <!-- Dossiers : barre latérale (desktop) -->
    <aside class="hidden md:block">
      <nav class="sticky top-24 max-h-[calc(100dvh-14rem)] overflow-y-auto pr-1" aria-label="Dossiers">
        <h2 class="px-3 pb-2 text-sm font-semibold text-mute">Dossiers</h2>
        <ul>
          <li
            v-for="f in flatFolders"
            :key="f.drive_id"
            class="group relative"
          >
            <button
              class="flex w-full items-center gap-3 rounded-xl py-2 pr-10 text-left transition-colors"
              :class="selectedId === f.drive_id ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'"
              :style="{ paddingLeft: 12 + f.depth * 14 + 'px' }"
              :aria-current="selectedId === f.drive_id ? 'true' : undefined"
              @click="selectedId = f.drive_id"
            >
              <CoverArt :name="f.name" class="h-9 w-9" rounded="rounded-md" />
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium">{{ f.name }}</span>
                <span class="block text-xs text-mute">{{ counts[f.drive_id] || 0 }} fichier{{ (counts[f.drive_id] || 0) > 1 ? 's' : '' }}</span>
              </span>
            </button>
            <!-- Repère de partage -->
            <span
              v-if="isOwner && isCovered(f)"
              class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-accent group-hover:opacity-0"
              title="Partagé"
            >
              <Users :size="15" />
            </span>
            <button
              v-if="isOwner"
              class="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-mute opacity-0 transition hover:bg-white/10 hover:text-white focus-visible:opacity-100 group-hover:opacity-100"
              :aria-label="`Partager ${f.name}`"
              @click="shareFolder = f"
            >
              <Share2 :size="15" />
            </button>
          </li>
        </ul>
        <p v-if="!flatFolders.length" class="px-3 py-4 text-sm text-mute">Aucun dossier avec de l'audio.</p>
      </nav>
    </aside>

    <section class="min-w-0 pb-40">
      <!-- Dossiers : pastilles (mobile) -->
      <div v-if="flatFolders.length > 1" class="md:hidden -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none" role="tablist" aria-label="Dossiers">
        <button
          v-for="f in flatFolders"
          :key="f.drive_id"
          role="tab"
          :aria-selected="selectedId === f.drive_id"
          class="flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors"
          :class="selectedId === f.drive_id ? 'bg-white text-ink' : 'bg-raised text-white/75'"
          @click="selectedId = f.drive_id"
        >
          {{ f.name }}
          <span :class="selectedId === f.drive_id ? 'text-ink/55' : 'text-mute'" class="ml-1 text-xs">{{ counts[f.drive_id] || 0 }}</span>
        </button>
      </div>

      <!-- En-tête du dossier -->
      <header v-if="selected" class="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-7">
        <CoverArt :name="selected.name" class="h-36 w-36 sm:h-44 sm:w-44 shadow-2xl shadow-black/50 self-center sm:self-auto" rounded="rounded-2xl" />
        <div class="min-w-0 flex-1 text-center sm:text-left">
          <h1 class="text-3xl font-bold leading-tight tracking-tight md:text-5xl line-clamp-2 break-words">{{ selected.name }}</h1>
          <p class="mt-2 text-sm text-mute">
            {{ selectedCount }} fichier{{ selectedCount > 1 ? 's' : '' }} audio
            <template v-if="!isOwner"> · {{ canEdit ? 'tu peux écouter et renommer' : 'écoute seule' }}</template>
          </p>

          <div class="mt-5 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <button
              class="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white/90 active:scale-[0.98] disabled:opacity-40"
              :disabled="!visibleFiles.length"
              @click="playAll"
            >
              <Play :size="17" fill="currentColor" /> Tout écouter
            </button>

            <button
              v-if="isOwner"
              class="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition active:scale-[0.98]"
              :class="directShares.length ? 'bg-accent/15 text-accent hover:bg-accent/25' : 'bg-accent text-ink hover:bg-accent-strong'"
              @click="shareFolder = selected"
            >
              <Users v-if="directShares.length" :size="17" />
              <Share2 v-else :size="17" />
              {{ directShares.length ? `Partagé · ${directShares.length} lien${directShares.length > 1 ? 's' : ''}` : 'Partager' }}
            </button>
          </div>

          <p v-if="isOwner && !directShares.length && selectedCovered" class="mt-3 text-xs text-mute">
            Ce dossier est déjà accessible via un dossier parent partagé.
          </p>
        </div>
      </header>

      <!-- Outils -->
      <div class="mt-8 grid grid-cols-[1fr_auto] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div class="col-span-2 flex items-center rounded-full bg-raised px-4 focus-within:ring-1 focus-within:ring-accent sm:col-span-1">
          <Search :size="17" stroke-width="1.75" class="mr-3 flex-shrink-0 text-mute" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Rechercher dans ce dossier"
            aria-label="Rechercher un fichier"
            class="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-mute"
          />
        </div>

        <div class="relative">
          <ListFilter :size="16" stroke-width="1.75" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
          <select
            v-model="sortBy"
            aria-label="Trier"
            class="w-full cursor-pointer appearance-none rounded-full bg-raised py-3 pl-10 pr-8 text-sm text-white outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="date">Plus récents</option>
            <option value="name">Alphabétique</option>
          </select>
          <ChevronDown :size="14" class="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-mute" />
        </div>

        <button
          role="switch"
          :aria-checked="includeSub"
          class="flex items-center gap-3 rounded-full bg-raised py-2.5 pl-4 pr-3 text-sm text-white/80"
          @click="includeSub = !includeSub"
        >
          Sous-dossiers
          <span class="relative h-6 w-10 rounded-full transition-colors" :class="includeSub ? 'bg-accent' : 'bg-white/15'">
            <span class="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" :class="includeSub ? 'left-[18px]' : 'left-0.5'"></span>
          </span>
        </button>
      </div>

      <p v-if="player.error.value" class="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
        {{ player.error.value }}
      </p>

      <!-- Liste des fichiers -->
      <div v-if="visibleFiles.length" class="mt-4">
        <div class="hidden md:grid grid-cols-[44px_1fr_130px_90px_44px] gap-3 border-b border-line px-3 pb-2 text-xs text-mute">
          <span class="text-center">#</span>
          <span>Titre</span>
          <span>Ajouté le</span>
          <span class="text-right">Taille</span>
          <span></span>
        </div>

        <ul>
          <li
            v-for="(file, i) in visibleFiles"
            :key="file.drive_id"
            class="group relative grid cursor-pointer grid-cols-[44px_1fr_auto] items-center gap-3 rounded-xl px-1 py-1.5 transition-colors hover:bg-white/[0.06] md:grid-cols-[44px_1fr_130px_90px_44px] md:px-3"
            :class="player.currentId.value === file.drive_id ? 'bg-white/[0.07]' : ''"
            @click="play(file)"
          >
            <!-- Numéro / lecture / égaliseur -->
            <button
              class="grid h-11 w-11 place-items-center text-sm tabular-nums"
              :class="player.currentId.value === file.drive_id ? 'text-accent' : 'text-mute'"
              :aria-label="(player.currentId.value === file.drive_id && player.playing.value ? 'Pause ' : 'Lire ') + file.name"
              @click.stop="play(file)"
            >
              <span v-if="player.currentId.value === file.drive_id && player.playing.value" class="flex h-4 items-end gap-[3px] group-hover:hidden" aria-hidden="true">
                <span class="eq-bar block h-full w-[3px] rounded-full bg-accent"></span>
                <span class="eq-bar block h-full w-[3px] rounded-full bg-accent"></span>
                <span class="eq-bar block h-full w-[3px] rounded-full bg-accent"></span>
              </span>
              <span v-else class="group-hover:hidden">{{ i + 1 }}</span>
              <span class="hidden group-hover:block text-white">
                <Pause v-if="player.currentId.value === file.drive_id && player.playing.value" :size="18" fill="currentColor" />
                <Play v-else :size="18" fill="currentColor" />
              </span>
            </button>

            <!-- Titre -->
            <div class="min-w-0">
              <p class="truncate text-[15px] font-medium" :class="player.currentId.value === file.drive_id ? 'text-accent' : 'text-white'">
                {{ file.name }}
              </p>
              <p class="truncate text-xs text-mute">
                <span v-if="includeSub && file.parent_id !== selectedId">{{ folderName(file.parent_id) }}</span>
                <span v-if="includeSub && file.parent_id !== selectedId && file.size"> – </span>
                <span class="md:hidden">{{ formatSize(file.size) }}</span>
              </p>
            </div>

            <span class="hidden text-sm text-mute md:block">{{ formatDate(file.created_time) }}</span>
            <span class="hidden text-right text-sm tabular-nums text-mute md:block">{{ formatSize(file.size) }}</span>

            <!-- Menu -->
            <div class="relative flex justify-end">
              <button
                v-if="canEdit || isOwner"
                class="grid h-11 w-11 place-items-center rounded-full text-mute transition hover:text-white md:h-9 md:w-9 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                :class="menuFor === file.drive_id ? 'md:!opacity-100 text-white' : ''"
                aria-label="Plus d'actions"
                aria-haspopup="menu"
                :aria-expanded="menuFor === file.drive_id"
                @click.stop="menuFor = menuFor === file.drive_id ? null : file.drive_id"
              >
                <Ellipsis :size="18" />
              </button>
              <div
                v-if="menuFor === file.drive_id"
                class="absolute right-0 top-full z-30 mt-1 w-56 overflow-hidden rounded-xl border border-line bg-raised py-1 shadow-2xl"
                role="menu"
                @click.stop
              >
                <button v-if="canEdit" role="menuitem" class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-white/10" @click="menuFor = null; renameItem(file)">
                  <Pencil :size="16" class="text-mute" /> Renommer
                </button>
                <button v-if="isOwner" role="menuitem" class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-300 hover:bg-red-500/10" @click="menuFor = null; deleteItem(file)">
                  <Trash2 :size="16" /> Mettre à la corbeille
                </button>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <!-- Vide -->
      <div v-else class="mt-8 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
        <p class="font-medium">{{ searchQuery ? 'Aucun résultat' : 'Aucun fichier audio ici' }}</p>
        <p class="mt-1 text-sm text-mute">
          <template v-if="searchQuery">Essaie un autre mot ou efface la recherche.</template>
          <template v-else-if="!includeSub && selectedCount === 0 && (counts[selectedId] || 0) > 0">Active « Sous-dossiers » pour voir les fichiers des dossiers qu'il contient.</template>
          <template v-else>Ajoute des fichiers audio dans ce dossier sur Drive, puis réindexe la bibliothèque.</template>
        </p>
      </div>
    </section>

    <!-- Fermer le menu au clic à côté -->
    <div v-if="menuFor" class="fixed inset-0 z-20" @click="menuFor = null"></div>

    <ShareDialog v-if="shareFolder" :library-id="libraryId" :folder="shareFolder" @close="closeShare" />
  </div>
</template>

<script setup>
import { Play, Pause, Search, Pencil, Trash2, Share2, Users, ListFilter, ChevronDown, Ellipsis } from 'lucide-vue-next'

const props = defineProps({
  items: { type: Array, default: () => [] },
  libraryId: { type: String, default: '' },
  isOwner: { type: Boolean, default: false },
  canEdit: { type: Boolean, default: false },
  shareToken: { type: String, default: '' }
})
const emit = defineEmits(['changed'])

const player = useAudioPlayer()

const selectedId = ref(null)
const searchQuery = ref('')
const sortBy = ref('date')
const includeSub = ref(false)
const shareFolder = ref(null)
const menuFor = ref(null)

// --- Arborescence ---
const folders = computed(() => props.items.filter(i => i.is_folder))
const audio = computed(() => props.items.filter(i => !i.is_folder))
const byId = computed(() => Object.fromEntries(folders.value.map(f => [f.drive_id, f])))

const flatFolders = computed(() => {
  const children = {}
  const roots = []
  for (const f of folders.value) {
    if (f.parent_id && byId.value[f.parent_id]) (children[f.parent_id] ||= []).push(f)
    else roots.push(f) // la racine de la bibliothèque, ou du dossier partagé
  }
  const out = []
  const walk = (f, depth) => {
    out.push({ ...f, depth })
    ;(children[f.drive_id] || []).sort((a, b) => a.name.localeCompare(b.name)).forEach(c => walk(c, depth + 1))
  }
  roots.forEach(r => walk(r, 0))
  return out
})

const counts = computed(() => {
  const c = {}
  for (const f of audio.value) for (const id of f.path_ids) c[id] = (c[id] || 0) + 1
  return c
})

watch(flatFolders, (list) => {
  if (!list.length) { selectedId.value = null; return }
  if (!selectedId.value || !byId.value[selectedId.value]) selectedId.value = list[0].drive_id
}, { immediate: true })

const folderName = (id) => byId.value[id]?.name || ''
const selected = computed(() => byId.value[selectedId.value] || null)

// --- Fichiers affichés ---
const visibleFiles = computed(() => {
  if (!selectedId.value) return []
  let r = audio.value.filter(f =>
    includeSub.value ? (f.parent_id === selectedId.value || f.path_ids.includes(selectedId.value)) : f.parent_id === selectedId.value
  )
  const q = searchQuery.value.trim().toLowerCase()
  if (q) r = r.filter(f => f.name.toLowerCase().includes(q))
  return [...r].sort(sortBy.value === 'name'
    ? (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })
    : (a, b) => new Date(b.created_time) - new Date(a.created_time))
})
const selectedCount = computed(() => visibleFiles.value.length)

// --- Partage : état des liens (propriétaire) ---
const shares = ref([])
const loadShares = async () => {
  if (!props.isOwner || !props.libraryId) { shares.value = []; return }
  try {
    shares.value = (await $fetch('/api/shares', { query: { libraryId: props.libraryId } })).shares
  } catch { shares.value = [] }
}
watch(() => props.libraryId, loadShares, { immediate: true })

const sharedIds = computed(() => new Set(shares.value.map(s => s.folder_id)))
const isCovered = (f) => sharedIds.value.has(f.drive_id) || f.path_ids.some(id => sharedIds.value.has(id))
const directShares = computed(() => selected.value ? shares.value.filter(s => s.folder_id === selected.value.drive_id) : [])
const selectedCovered = computed(() => selected.value ? isCovered(selected.value) : false)
const closeShare = () => { shareFolder.value = null; loadShares() }

// --- Lecture ---
const trackOf = (f) => ({
  id: f.drive_id,
  title: f.name,
  src: `/api/stream?id=${encodeURIComponent(f.drive_id)}${props.shareToken ? '&share=' + encodeURIComponent(props.shareToken) : ''}`
})
const play = (file) => player.toggle(trackOf(file), visibleFiles.value.map(trackOf))
const playAll = () => { if (visibleFiles.value.length) play(visibleFiles.value[0]) }

const formatSize = (b) => {
  if (!b) return ''
  return b > 1e6 ? (b / 1e6).toFixed(1) + ' Mo' : Math.round(b / 1e3) + ' Ko'
}
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

// --- Actions ---
const query = computed(() => props.shareToken ? { share: props.shareToken } : {})
const errMsg = (e) => e?.data?.message || e?.message || 'Erreur'

const renameItem = async (file) => {
  const name = prompt('Nouveau nom :', file.name)
  if (!name || name.trim() === file.name) return
  try {
    await $fetch(`/api/items/${file.drive_id}`, { method: 'PATCH', body: { name }, query: query.value })
    emit('changed')
  } catch (e) { alert(errMsg(e)) }
}
const deleteItem = async (file) => {
  if (!confirm(`Mettre « ${file.name} » à la corbeille Drive ?`)) return
  try {
    if (player.currentId.value === file.drive_id) player.stop()
    await $fetch(`/api/items/${file.drive_id}`, { method: 'DELETE' })
    emit('changed')
  } catch (e) { alert(errMsg(e)) }
}
</script>
