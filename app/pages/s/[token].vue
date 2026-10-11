<template>
  <div>
    <header class="sticky top-0 z-30 border-b border-line bg-ink/85 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
      <div class="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 md:px-8">
        <BrandMark :size="30" />
        <span v-if="!error && !loading" class="rounded-full bg-raised px-3.5 py-1.5 text-xs font-medium text-white/80">
          {{ role === 'editor' ? 'Écoute et renommage' : 'Écoute seule' }}
        </span>
      </div>
    </header>

    <main class="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-10">
      <div v-if="error" class="mx-auto max-w-md rounded-3xl border border-line bg-surface px-6 py-12 text-center">
        <h1 class="text-xl font-semibold">Ce lien n'est plus valide</h1>
        <p class="mt-2 text-sm leading-relaxed text-white/70">
          {{ error }} Demande un nouveau lien à la personne qui t'a partagé ce dossier.
        </p>
      </div>

      <p v-else-if="loading" class="py-24 text-center text-sm text-mute">Chargement du dossier partagé…</p>

      <LibraryView v-else :items="items" :share-token="token" :can-edit="role === 'editor'" @changed="load" />
    </main>

    <footer class="mx-auto max-w-[1400px] px-4 pb-44 md:px-8">
      <p class="border-t border-line pt-6 text-sm text-mute">
        Partagé avec AudioGdrive, créé par <span class="font-semibold text-white/80">GATO</span>.
        Les fichiers restent privés sur le Drive de la personne qui partage.
      </p>
    </footer>
  </div>
</template>

<script setup>
const route = useRoute()
const token = route.params.token

const items = ref([])
const role = ref('viewer')
const loading = ref(true)
const error = ref('')

const load = async () => {
  try {
    const r = await $fetch(`/api/shared/${token}`)
    items.value = r.items
    role.value = r.share.role
  } catch (e) {
    error.value = e?.data?.message || 'Le lien est invalide ou a expiré.'
  }
  loading.value = false
}
onMounted(load)
</script>
