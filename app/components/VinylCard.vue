<script lang="ts" setup>
const props = defineProps<{
  id: number
  title: string
  artist: string
  year?: string
  label?: string
  genre?: string | string[]
  thumb?: string
  cover?: string
  community?: { want: number, have: number }
  showActions?: boolean
}>()

const initials = computed(() => {
  if (!props.artist) return '?'
  return props.artist.split(' ').map(w => w[0]).filter(Boolean).join('').substring(0, 2).toUpperCase()
})
</script>

<template>
  <NuxtLink :to="`/vinyl/${id}`" class="group cursor-pointer">
    <div class="relative aspect-square overflow-hidden rounded-lg bg-g-100">
      <img
        v-if="cover || thumb"
        :src="cover || thumb"
        :alt="title"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        decoding="async"
      >
      <div v-else class="flex h-full w-full items-center justify-center bg-g-200">
        <span class="text-3xl font-black text-g-400/30 sm:text-4xl lg:text-5xl">
          {{ initials }}
        </span>
      </div>

      <VinylCardActions
        v-if="showActions !== false"
        :discogs-id="id"
        :title="title"
        :artist="artist"
        :thumb="thumb"
        :cover="cover"
        :label="label"
        :genre="genre"
        :year="year"
      />

      <div class="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-g-black/80 via-g-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div class="flex w-full items-end justify-between p-3">
          <span v-if="community" class="rounded-lg bg-g-black/40 px-2 py-1 text-[11px] font-medium text-g-white">
            {{ community.want }} wants
          </span>
          <span class="rounded-lg bg-g-black/40 px-2 py-1 text-[11px] font-medium text-g-white">
            Voir →
          </span>
        </div>
      </div>
    </div>

    <div class="mt-2 min-w-0 sm:mt-3">
      <p class="truncate text-sm font-semibold text-g-950">{{ title }}</p>
      <p class="mt-0.5 truncate text-xs text-g-500">{{ artist }}</p>
      <div v-if="label || year" class="mt-1.5 flex items-center justify-between sm:mt-2">
        <span class="truncate text-[11px] text-g-400">{{ [label, year].filter(Boolean).join(' · ') }}</span>
      </div>
    </div>
  </NuxtLink>
</template>
