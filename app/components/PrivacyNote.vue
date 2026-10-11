<template>
  <div class="flex gap-3 rounded-2xl border border-accent/25 bg-accent/[0.07]" :class="compact ? 'p-3' : 'p-4 md:p-5'">
    <ShieldCheck :size="compact ? 18 : 22" stroke-width="1.75" class="mt-0.5 flex-shrink-0 text-accent" />
    <div class="min-w-0 text-sm leading-relaxed">
      <p class="font-semibold text-white">Pas besoin de rendre tes fichiers publics</p>
      <p class="mt-1 text-white/70">
        <template v-if="compact">
          Tes fichiers restent privés sur Google Drive. Les personnes avec le lien écoutent via AudioGdrive, sans accéder à ton Drive.
        </template>
        <template v-else>
          Tes fichiers restent privés sur Google Drive. AudioGdrive les lit avec ton autorisation et les diffuse lui-même :
          les personnes qui ouvrent un lien de partage n'ont ni accès à ton Drive, ni besoin d'un compte Google.
        </template>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ShieldCheck } from 'lucide-vue-next'
defineProps({ compact: { type: Boolean, default: false } })
</script>
