<template>
  <div class="relative flex-shrink-0 overflow-hidden" :class="rounded" :style="{ background: bg }" aria-hidden="true">
    <!-- Les marges en % se calculent sur le conteneur parent : on les met sur un calque absolu
         pour qu'elles suivent la taille de la pochette, pas celle de la page. -->
    <div class="absolute inset-0 flex items-end justify-center gap-[7%] px-[17%] pb-[20%]">
      <span
        v-for="(h, i) in bars"
        :key="i"
        class="w-[12%] rounded-full"
        :style="{ height: h + '%', background: fg }"
      ></span>
    </div>
  </div>
</template>

<script setup>
// Pochette générée : la teinte et la forme d'onde viennent du nom, donc
// chaque dossier / morceau garde toujours la même identité visuelle.
const props = defineProps({
  name: { type: String, default: '' },
  rounded: { type: String, default: 'rounded-lg' }
})

const hash = computed(() => {
  let h = 2166136261
  for (const c of props.name) {
    h ^= c.codePointAt(0)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
})
const hue = computed(() => hash.value % 360)
const bg = computed(() => `hsl(${hue.value} 30% 22%)`)
const fg = computed(() => `hsl(${hue.value} 60% 74%)`)
const bars = computed(() => [0, 1, 2, 3].map(i => 30 + ((hash.value >> (i * 5)) & 31) * 1.7))
</script>
