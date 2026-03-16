<script lang="ts" setup>
const props = withDefaults(defineProps<{ variant?: 'dark' | 'light' }>(), { variant: 'dark' })
const { searchReleases } = useDiscogs()
const query = ref('')
const results = ref<{ id: number, title: string, artist: string, year: string, thumb: string }[]>([])
const isOpen = ref(false)
const isSearching = ref(false)
const container = ref<HTMLElement | null>(null)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

async function onInput() {
  const q = query.value.trim()
  if (q.length < 2) {
    results.value = []
    isOpen.value = false
    return
  }

  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    isSearching.value = true
    try {
      const res = await searchReleases({ q, per_page: 8 })
      results.value = res.results.map(r => ({
        id: r.id,
        title: r.title.includes(' - ') ? r.title.split(' - ').slice(1).join(' - ') : r.title,
        artist: (r.title.includes(' - ') ? r.title.split(' - ')[0] : '') || '',
        year: r.year || '',
        thumb: r.thumb,
      }))
      isOpen.value = results.value.length > 0
    }
    catch {
      results.value = []
    }
    finally {
      isSearching.value = false
    }
  }, 300)
}

function onFocus() {
  if (query.value.trim().length >= 2 && results.value.length) {
    isOpen.value = true
  }
}

function close() {
  isOpen.value = false
}

function select(id: number) {
  isOpen.value = false
  query.value = ''
  results.value = []
  navigateTo(`/vinyl/${id}`)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

function onClickOutside(e: MouseEvent) {
  if (container.value && !container.value.contains(e.target as Node)) {
    close()
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div ref="container" class="relative">
    <div
      class="flex items-center rounded-lg border px-4 py-2.5 transition-colors"
      :class="props.variant === 'light'
        ? 'border-g-200 bg-white focus-within:border-g-400'
        : 'border-g-500 bg-g-700 focus-within:border-g-400 focus-within:bg-g-600'"
    >
      <UIcon name="i-lucide-search" class="mr-2.5 h-[18px] w-[18px] shrink-0 text-g-400" />
      <input
        v-model="query"
        type="text"
        placeholder="Artiste, album, label, pressage…"
        class="w-full bg-transparent text-[15px] outline-none placeholder:text-g-400"
        :class="props.variant === 'light' ? 'text-g-950' : 'text-g-white'"
        @input="onInput"
        @focus="onFocus"
        @keydown="onKeydown"
      >
      <UIcon
        v-if="isSearching"
        name="i-lucide-loader-2"
        class="ml-2 h-4 w-4 shrink-0 animate-spin text-g-400"
      />
    </div>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="translate-y-1 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-1 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute left-0 right-0 top-full z-50 mt-2 max-h-[420px] overflow-y-auto rounded-lg border border-g-100 bg-white shadow-xl"
      >
        <button
          v-for="item in results"
          :key="item.id"
          class="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-g-50"
          @click="select(item.id)"
        >
          <div class="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-g-100">
            <img
              v-if="item.thumb"
              :src="item.thumb"
              :alt="item.title"
              class="h-full w-full object-cover"
            >
            <div v-else class="flex h-full w-full items-center justify-center text-xs font-bold text-g-300">
              {{ (item.artist || '?').substring(0, 2).toUpperCase() }}
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-g-950">{{ item.title }}</p>
            <p class="truncate text-xs text-g-400">{{ item.artist }} {{ item.year ? `· ${item.year}` : '' }}</p>
          </div>
        </button>

        <NuxtLink
          :to="`/explore?q=${encodeURIComponent(query)}`"
          class="flex cursor-pointer items-center justify-center gap-1.5 border-t border-g-100 px-4 py-3 text-xs font-medium text-g-500 transition-colors hover:bg-g-50 hover:text-g-950"
          @click="close"
        >
          Voir tous les résultats
          <UIcon name="i-lucide-arrow-right" class="h-3 w-3" />
        </NuxtLink>
      </div>
    </Transition>
  </div>
</template>
