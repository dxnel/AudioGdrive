<template>
  <div>
    <!-- ───────── DÉCONNECTÉ ───────── -->
    <main v-if="!user" class="grid min-h-dvh md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <div class="flex flex-col justify-between px-6 py-8 md:px-14 md:py-12">
        <BrandMark :size="34" />

        <div class="my-12 max-w-[34rem] md:my-0">
          <WaveArt :count="26" class="mb-10 h-20 md:hidden" />
          <h1 class="text-[2.5rem] font-bold leading-[1.05] tracking-tight md:text-6xl">
            Écoute et partage les audios de ton Google&nbsp;Drive.
          </h1>
          <p class="mt-5 max-w-[30rem] text-base leading-relaxed text-white/70 md:text-lg">
            Choisis un dossier : tes enregistrements deviennent une bibliothèque que tu peux écouter, trier, renommer et partager par lien.
          </p>

          <button
            @click="loginWithGoogle"
            class="mt-8 w-full rounded-full bg-white px-8 py-4 text-[15px] font-semibold text-ink transition hover:bg-white/90 active:scale-[0.99] sm:w-auto"
          >
            Continuer avec Google
          </button>
          <p class="mt-3 text-xs leading-relaxed text-mute">
            En te connectant, tu autorises AudioGdrive à lire et à gérer les fichiers de ton Google Drive.
          </p>

          <PrivacyNote class="mt-8" />
        </div>

        <p class="text-sm text-mute">AudioGdrive, créé par <span class="font-semibold text-white/80">GATO</span></p>
      </div>

      <div class="relative hidden items-center overflow-hidden border-l border-line bg-surface md:flex">
        <WaveArt :count="30" class="mx-14 h-[58%] w-full" />
      </div>
    </main>

    <!-- ───────── CONNECTÉ ───────── -->
    <div v-else>
      <header class="sticky top-0 z-30 border-b border-line bg-ink/85 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div class="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 md:px-8">
          <BrandMark :size="30" />

          <div class="order-last flex w-full items-center gap-2 md:order-none md:ml-6 md:w-auto md:flex-1">
            <div v-if="libraries.length" class="relative min-w-0 flex-1 md:max-w-xs">
              <Library :size="16" stroke-width="1.75" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
              <select
                v-model="currentLibId"
                @change="loadItems"
                aria-label="Bibliothèque"
                class="w-full cursor-pointer appearance-none truncate rounded-full bg-raised py-2.5 pl-10 pr-9 text-sm font-medium text-white outline-none focus:ring-1 focus:ring-accent"
              >
                <option v-for="l in libraries" :key="l.id" :value="l.id">{{ l.name }}</option>
              </select>
              <ChevronDown :size="15" class="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-mute" />
            </div>
            <button
              @click="showPicker = true"
              class="flex flex-shrink-0 items-center gap-2 rounded-full bg-raised px-4 py-2.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
            >
              <FolderPlus :size="16" stroke-width="1.75" />
              <span class="hidden sm:inline">Ajouter un dossier</span>
              <span class="sm:hidden">Ajouter</span>
            </button>
            <button
              v-if="currentLib"
              @click="rescan"
              :disabled="busy"
              class="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-raised text-white/80 transition-colors hover:bg-white/10 disabled:opacity-50"
              aria-label="Réindexer depuis le Drive"
              title="Réindexer depuis le Drive"
            >
              <RefreshCcw :size="16" stroke-width="1.75" :class="busy ? 'animate-spin' : ''" />
            </button>
          </div>

          <!-- Compte -->
          <div class="relative ml-auto">
            <button
              @click="menuOpen = !menuOpen"
              class="grid h-10 w-10 place-items-center rounded-full bg-accent text-sm font-bold text-ink"
              aria-label="Compte"
              aria-haspopup="menu"
              :aria-expanded="menuOpen"
            >
              {{ (user.email || '?').charAt(0).toUpperCase() }}
            </button>
            <div v-if="menuOpen" class="fixed inset-0 z-40" @click="menuOpen = false"></div>
            <div v-if="menuOpen" class="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-line bg-raised shadow-2xl" role="menu">
              <div class="border-b border-line px-4 py-3">
                <p class="text-xs text-mute">Connecté avec</p>
                <p class="truncate text-sm font-medium">{{ user.email }}</p>
              </div>
              <button v-if="currentLib" role="menuitem" class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-white/10" @click="menuOpen = false; removeLibrary()">
                <Unlink :size="16" class="text-mute" /> Retirer cette bibliothèque
              </button>
              <button role="menuitem" class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-300 hover:bg-red-500/10" @click="menuOpen = false; logout()">
                <LogOut :size="16" /> Déconnexion
              </button>
              <p class="border-t border-line px-4 py-3 text-xs text-mute">AudioGdrive, créé par <span class="font-semibold text-white/80">GATO</span></p>
            </div>
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-10">
        <p v-if="errorMsg" class="mb-5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">{{ errorMsg }}</p>

        <p v-if="busy" class="mb-5 flex items-center gap-3 rounded-xl bg-accent/10 px-4 py-3 text-sm text-accent" role="status">
          <RefreshCcw :size="15" class="animate-spin" /> Indexation de ton Drive en cours, ça peut prendre un moment.
        </p>

        <!-- Chargement -->
        <p v-if="connected === null" class="py-24 text-center text-sm text-mute">Chargement…</p>

        <!-- Drive pas (ou plus) connecté -->
        <div v-else-if="connected === false" class="mx-auto max-w-md rounded-3xl border border-line bg-surface px-6 py-12 text-center">
          <h2 class="text-xl font-semibold">Reconnecte ton Google Drive</h2>
          <p class="mt-2 text-sm leading-relaxed text-white/70">L'autorisation d'accès à ton Drive a expiré ou n'a pas été accordée. Reconnecte-toi pour continuer.</p>
          <button @click="loginWithGoogle" class="mt-6 rounded-full bg-white px-7 py-3 text-sm font-semibold text-ink hover:bg-white/90 transition-colors">
            Reconnecter Google Drive
          </button>
        </div>

        <!-- Aucune bibliothèque -->
        <div v-else-if="connected && !libraries.length" class="mx-auto max-w-xl py-6 md:py-14">
          <h2 class="text-3xl font-bold tracking-tight md:text-4xl">Choisis ton premier dossier</h2>
          <p class="mt-3 text-base leading-relaxed text-white/70">
            Sélectionne un dossier de ton Drive. Tous ses sous-dossiers qui contiennent de l'audio sont ajoutés à ta bibliothèque.
          </p>
          <button @click="showPicker = true" class="mt-7 flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-ink hover:bg-accent-strong transition-colors">
            <FolderPlus :size="17" /> Choisir un dossier
          </button>
          <PrivacyNote class="mt-8" />
        </div>

        <!-- Bibliothèque -->
        <LibraryView
          v-else-if="currentLib"
          :items="items"
          :library-id="currentLib.id"
          is-owner
          can-edit
          @changed="loadItems"
        />
      </main>
    </div>

    <!-- Sélecteur de dossier -->
    <div v-if="showPicker" class="fixed inset-0 z-[60] flex items-end justify-center bg-black/65 backdrop-blur-sm md:items-center" @click.self="showPicker = false">
      <div class="w-full rounded-t-3xl border border-line bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl md:max-w-lg md:rounded-3xl" role="dialog" aria-modal="true" aria-labelledby="picker-title">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="picker-title" class="text-lg font-semibold">Choisir un dossier</h2>
            <p class="mt-0.5 text-sm text-mute">Ses sous-dossiers avec de l'audio seront ajoutés.</p>
          </div>
          <button @click="showPicker = false" class="-mr-2 grid h-10 w-10 place-items-center rounded-full text-mute hover:bg-white/10 hover:text-white" aria-label="Fermer"><X :size="20" /></button>
        </div>

        <div class="mb-3 flex flex-wrap items-center gap-1 text-sm text-mute">
          <template v-for="(c, i) in crumbs" :key="c.id">
            <button class="rounded-md px-1.5 py-1 hover:bg-white/10 hover:text-white" :class="i === crumbs.length - 1 ? 'font-medium text-white' : ''" @click="goCrumb(i)">{{ c.name }}</button>
            <ChevronRight v-if="i < crumbs.length - 1" :size="14" />
          </template>
        </div>

        <div class="h-64 overflow-y-auto rounded-2xl border border-line bg-ink/40 md:h-72">
          <p v-if="pickerLoading" class="p-4 text-sm text-mute">Chargement…</p>
          <button
            v-for="f in pickerFolders"
            :key="f.id"
            @click="enter(f)"
            class="flex w-full items-center gap-3 border-b border-line px-4 py-3.5 text-left text-sm transition-colors last:border-0 hover:bg-white/5"
          >
            <Folder :size="18" stroke-width="1.5" class="flex-shrink-0 text-mute" />
            <span class="min-w-0 flex-1 truncate">{{ f.name }}</span>
            <ChevronRight :size="16" class="text-mute" />
          </button>
          <p v-if="!pickerLoading && !pickerFolders.length" class="p-4 text-sm text-mute">Aucun sous-dossier ici.</p>
        </div>

        <button
          @click="pickCurrent"
          :disabled="crumbs.length < 2 || busy"
          class="mt-4 w-full truncate rounded-full bg-accent px-5 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-accent-strong disabled:bg-white/10 disabled:text-mute"
        >
          {{ busy ? 'Indexation…' : crumbs.length < 2 ? 'Ouvre un dossier pour le choisir' : `Utiliser « ${crumbs[crumbs.length - 1].name} »` }}
        </button>
      </div>
    </div>
    <footer class="mt-20 py-8 border-t border-line text-center pb-32">
      <p class="text-sm text-mute">Créé avec <span class="text-white font-medium">AudioGdrive</span></p>
    </footer>
  </div>
  <UiDialog ref="dialog" />

  
</template>

<script setup>
import { RefreshCcw, LogOut, Folder, FolderPlus, Library, Unlink, X, ChevronRight, ChevronDown } from 'lucide-vue-next'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const player = useAudioPlayer()

const connected = ref(null) // null = inconnu, true/false
const libraries = ref([])
const currentLibId = ref('')
const items = ref([])
const busy = ref(false)
const errorMsg = ref('')
const menuOpen = ref(false)

const currentLib = computed(() => libraries.value.find(l => l.id === currentLibId.value) || null)
const errMsg = (e) => e?.data?.message || e?.message || 'Erreur'

// --- Auth ---
const loginWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: 'https://www.googleapis.com/auth/drive',
      redirectTo: window.location.origin,
      // offline + consent : obligatoire pour recevoir un refresh token Google
      queryParams: { access_type: 'offline', prompt: 'consent' }
    }
  })
  if (error) errorMsg.value = error.message
}

const logout = async () => {
  player.stop()
  await supabase.auth.signOut()
  libraries.value = []; items.value = []; currentLibId.value = ''; connected.value = null
}

// Juste après le login, Supabase expose provider_refresh_token UNE fois :
// on l'envoie au serveur qui le stocke chiffré.
let syncing = false
const syncConnection = async (session) => {
  if (!session || syncing) return
  syncing = true
  try {
    if (session.provider_refresh_token) {
      await $fetch('/api/auth/connect', { method: 'POST', body: { refreshToken: session.provider_refresh_token } })
    }
    const c = await $fetch('/api/connection')
    connected.value = c.connected
    if (c.connected) await loadLibraries()
  } catch (e) {
    if (e?.statusCode === 409) connected.value = false
    else errorMsg.value = errMsg(e)
  } finally {
    syncing = false
  }
}

onMounted(() => {
  supabase.auth.getSession().then(({ data }) => syncConnection(data.session))
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') syncConnection(session)
  })
})

// --- Bibliothèques ---
const loadLibraries = async () => {
  const r = await $fetch('/api/libraries')
  libraries.value = r.libraries
  if (!currentLib.value) currentLibId.value = r.libraries[0]?.id || ''
  if (currentLibId.value) await loadItems()
}

const loadItems = async () => {
  if (!currentLibId.value) return
  errorMsg.value = ''
  try {
    items.value = (await $fetch(`/api/libraries/${currentLibId.value}/items`)).items
  } catch (e) {
    if (e?.statusCode === 409) connected.value = false
    else errorMsg.value = errMsg(e)
  }
}

const rescan = async () => {
  busy.value = true; errorMsg.value = ''
  try {
    await $fetch(`/api/libraries/${currentLibId.value}/scan`, { method: 'POST' })
    await loadItems()
  } catch (e) {
    if (e?.statusCode === 409) connected.value = false
    else errorMsg.value = errMsg(e)
  }
  busy.value = false
}

const removeLibrary = async () => {
  if (!confirm(`Retirer « ${currentLib.value.name} » de l'app ? (ton Drive n'est pas modifié, les liens de partage seront supprimés)`)) return
  player.stop()
  await $fetch(`/api/libraries/${currentLibId.value}`, { method: 'DELETE' })
  currentLibId.value = ''
  items.value = []
  await loadLibraries()
}

// --- Sélecteur de dossier ---
const showPicker = ref(false)
const crumbs = ref([{ id: 'root', name: 'Mon Drive' }])
const pickerFolders = ref([])
const pickerLoading = ref(false)

const loadPicker = async () => {
  pickerLoading.value = true
  try {
    const r = await $fetch('/api/drive/folders', { query: { parent: crumbs.value.at(-1).id } })
    pickerFolders.value = r.folders
  } catch (e) {
    errorMsg.value = errMsg(e)
    if (e?.statusCode === 409) { connected.value = false; showPicker.value = false }
  }
  pickerLoading.value = false
}
watch(showPicker, (v) => { if (v) { crumbs.value = [{ id: 'root', name: 'Mon Drive' }]; loadPicker() } })
const enter = (f) => { crumbs.value.push({ id: f.id, name: f.name }); loadPicker() }
const goCrumb = (i) => { crumbs.value = crumbs.value.slice(0, i + 1); loadPicker() }

const pickCurrent = async () => {
  busy.value = true; errorMsg.value = ''
  try {
    const r = await $fetch('/api/libraries', { method: 'POST', body: { folderId: crumbs.value.at(-1).id } })
    showPicker.value = false
    await loadLibraries()
    currentLibId.value = r.library.id
    await loadItems()
  } catch (e) { errorMsg.value = errMsg(e) }
  busy.value = false
}
</script>
