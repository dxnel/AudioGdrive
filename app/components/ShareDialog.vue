<template>
  <div class="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/65 backdrop-blur-sm" @click.self="$emit('close')">
    <div
      class="w-full md:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl md:rounded-3xl border border-line bg-surface shadow-2xl pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-title"
    >
      <!-- En-tête -->
      <div class="flex items-center gap-4 p-5 pb-4">
        <CoverArt :name="folder.name" class="h-14 w-14" rounded="rounded-xl" />
        <div class="min-w-0 flex-1">
          <h2 id="share-title" class="text-lg font-semibold leading-tight">Partager ce dossier</h2>
          <p class="mt-0.5 truncate text-sm text-mute">{{ folder.name }}</p>
        </div>
        <button @click="$emit('close')" class="h-10 w-10 -mr-2 grid place-items-center rounded-full text-mute hover:bg-white/10 hover:text-white transition-colors" aria-label="Fermer">
          <X :size="20" />
        </button>
      </div>

      <div class="px-5 space-y-6">
        <p class="text-sm leading-relaxed text-white/70">
          Le lien donne accès à ce dossier et à ses sous-dossiers. La personne n'a pas besoin de compte Google.
        </p>

        <!-- Nouveau lien -->
        <div class="space-y-4">
          <fieldset>
            <legend class="mb-2 text-sm font-medium">Ce que la personne peut faire</legend>
            <div class="grid grid-cols-2 gap-2">
              <label
                v-for="opt in roles"
                :key="opt.value"
                class="cursor-pointer rounded-xl border p-3 transition-colors"
                :class="role === opt.value ? 'border-accent bg-accent/10' : 'border-line bg-raised hover:border-white/20'"
              >
                <input v-model="role" type="radio" :value="opt.value" class="sr-only" />
                <span class="block text-sm font-medium">{{ opt.label }}</span>
                <span class="mt-0.5 block text-xs text-mute">{{ opt.hint }}</span>
              </label>
            </div>
          </fieldset>

          <div>
            <label for="share-expiry" class="mb-2 block text-sm font-medium">Durée du lien</label>
            <div class="relative">
              <select id="share-expiry" v-model.number="days" class="w-full appearance-none rounded-xl border border-line bg-raised px-4 py-3 pr-10 text-sm outline-none focus:border-accent">
                <option :value="0">Illimitée, jusqu'à révocation</option>
                <option :value="1">1 jour</option>
                <option :value="7">7 jours</option>
                <option :value="30">30 jours</option>
              </select>
              <ChevronDown :size="16" class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-mute" />
            </div>
          </div>

          <button @click="create" :disabled="busy" class="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-sm font-semibold text-ink hover:bg-accent-strong transition-colors disabled:opacity-50">
            <Link2 :size="17" />
            {{ busy ? 'Création…' : 'Créer un lien de partage' }}
          </button>
          <p v-if="err" class="text-sm text-red-400" role="alert">{{ err }}</p>
        </div>

        <!-- Liens actifs -->
        <div>
          <h3 class="mb-3 text-sm font-medium">Liens actifs</h3>
          <p v-if="!links.length" class="rounded-xl border border-dashed border-line px-4 py-5 text-center text-sm text-mute">
            Aucun lien pour ce dossier. Crée-en un ci-dessus.
          </p>
          <ul v-else class="space-y-3">
            <li v-for="l in links" :key="l.token" class="rounded-2xl border border-line bg-raised p-3.5">
              <div class="flex items-center justify-between gap-3 text-xs text-mute">
                <span class="font-medium text-white/80">{{ l.role === 'editor' ? 'Écoute et renommage' : 'Écoute seule' }}</span>
                <span>{{ l.expires_at ? 'Expire le ' + new Date(l.expires_at).toLocaleDateString('fr-CH') : "N'expire pas" }}</span>
              </div>
              <input
                :value="url(l.token)"
                readonly
                class="mt-2.5 w-full truncate rounded-lg bg-ink px-3 py-2 text-xs text-white/70 outline-none focus:ring-1 focus:ring-accent"
                aria-label="Lien de partage"
                @focus="$event.target.select()"
              />
              <div class="mt-3 flex items-center gap-2">
                <button @click="copy(l.token)" class="flex flex-1 items-center justify-center gap-2 rounded-full bg-white py-2.5 text-sm font-semibold text-ink hover:bg-white/90 transition-colors">
                  <Check v-if="copied === l.token" :size="16" class="text-green-600" />
                  <Copy v-else :size="16" />
                  {{ copied === l.token ? 'Lien copié' : 'Copier le lien' }}
                </button>
                <button v-if="canNativeShare" @click="nativeShare(l.token)" class="grid h-10 w-10 place-items-center rounded-full border border-line text-white hover:bg-white/10 transition-colors" aria-label="Envoyer le lien">
                  <Share2 :size="16" />
                </button>
                <button @click="revoke(l.token)" class="grid h-10 w-10 place-items-center rounded-full border border-line text-mute hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition-colors" aria-label="Révoquer ce lien">
                  <Trash2 :size="16" />
                </button>
              </div>
            </li>
          </ul>
          <p v-if="links.length" class="mt-3 text-xs text-mute">
            Toute personne qui a le lien peut écouter jusqu'à son expiration ou sa révocation.
          </p>
        </div>

        <PrivacyNote compact />
      </div>
    </div>
  </div>
</template>

<script setup>
import { X, Copy, Check, Trash2, Link2, Share2, ChevronDown } from 'lucide-vue-next'

const props = defineProps({
  libraryId: { type: String, required: true },
  folder: { type: Object, required: true } // { drive_id, name }
})
defineEmits(['close'])

const roles = [
  { value: 'viewer', label: 'Écouter', hint: 'Lecture seule' },
  { value: 'editor', label: 'Écouter et renommer', hint: 'Peut changer les noms' }
]

const links = ref([])
const role = ref('viewer')
const days = ref(0)
const busy = ref(false)
const err = ref('')
const copied = ref('')
const canNativeShare = ref(false)

const url = (token) => `${location.origin}/s/${token}`
const msg = (e) => e?.data?.message || e?.message || 'Erreur'

const load = async () => {
  try {
    const r = await $fetch('/api/shares', { query: { libraryId: props.libraryId, folderId: props.folder.drive_id } })
    links.value = r.shares
  } catch (e) { err.value = msg(e) }
}
const create = async () => {
  busy.value = true; err.value = ''
  try {
    await $fetch('/api/shares', {
      method: 'POST',
      body: { libraryId: props.libraryId, folderId: props.folder.drive_id, role: role.value, expiresInDays: days.value || null }
    })
    await load()
  } catch (e) { err.value = msg(e) }
  busy.value = false
}
const revoke = async (token) => {
  await $fetch(`/api/shares/${token}`, { method: 'DELETE' }).catch(() => {})
  await load()
}
const copy = async (token) => {
  try {
    await navigator.clipboard.writeText(url(token))
    copied.value = token
    setTimeout(() => { copied.value = '' }, 1800)
  } catch {
    // Pas de presse-papiers (page en http) : on sélectionne le lien pour le copier à la main
    err.value = 'Copie automatique indisponible ici : touche le lien et copie-le manuellement.'
  }
}
const nativeShare = async (token) => {
  try { await navigator.share({ title: props.folder.name, url: url(token) }) } catch { /* annulé */ }
}

onMounted(() => {
  canNativeShare.value = typeof navigator.share === 'function'
  load()
})
</script>
