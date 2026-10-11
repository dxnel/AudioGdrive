<template>
  <span class="inline-flex items-center gap-2.5">
    <svg :width="size" :height="size" viewBox="0 0 32 32" aria-hidden="true" class="flex-shrink-0">
      <rect width="32" height="32" rx="9" fill="#8B8CFF" />
      <g fill="#0E0F12">
        <rect x="6" y="11" width="3.4" height="10" rx="1.7" />
        <rect x="11.6" y="7" width="3.4" height="18" rx="1.7" />
        <rect x="17.2" y="9.5" width="3.4" height="13" rx="1.7" />
        <rect x="22.8" y="12.5" width="3.4" height="7" rx="1.7" />
      </g>
    </svg>
    <span v-if="wordmark" class="text-[17px] font-semibold tracking-tight leading-none">AudioGdrive</span>
  </span>
</template>

<script setup>
defineProps({
  size: { type: Number, default: 30 },
  wordmark: { type: Boolean, default: true }
})
</script>
