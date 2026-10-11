<template>
  <div class="min-h-dvh bg-ink font-sans text-white">
    <NuxtPage />
    <PlayerBar />
  </div>
</template>

<script setup>
useHead({
  title: 'AudioGdrive',
  htmlAttrs: { lang: 'fr' },
  meta: [
    { name: 'theme-color', content: '#0E0F12' },
    { name: 'description', content: 'AudioGdrive : écoute, range et partage les fichiers audio de ton Google Drive. Créé par GATO.' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700&display=swap' }
  ]
})
</script>
