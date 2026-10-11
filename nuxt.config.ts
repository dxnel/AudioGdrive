// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase'],
  css: ['~/assets/css/main.css'],
  supabase: {
    redirect: false
  },
  // Valeurs privées (serveur uniquement), remplies par les variables NUXT_* du .env
  runtimeConfig: {
    googleClientId: '',
    googleClientSecret: '',
    encryptionKey: ''
  }
})
