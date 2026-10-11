<template>
  <div class="flex items-end justify-between gap-[1.2%]" aria-hidden="true">
    <span
      v-for="(b, i) in bars"
      :key="i"
      class="bar-rise block flex-1 rounded-full"
      :style="{ height: b.h + '%', background: b.bright ? '#8B8CFF' : 'rgba(139,140,255,0.28)', animationDelay: i * 28 + 'ms' }"
    ></span>
  </div>
</template>

<script setup>
// Forme d'onde décorative de l'écran de connexion (déterministe, pas de hasard au rendu)
const props = defineProps({ count: { type: Number, default: 36 } })
const bars = computed(() =>
  Array.from({ length: props.count }, (_, i) => {
    const wave = Math.sin(i * 0.62) * 0.5 + Math.sin(i * 0.23 + 1.3) * 0.5
    return { h: Math.round(22 + (wave + 1) * 37), bright: i % 4 === 0 || i % 7 === 3 }
  })
)
</script>
