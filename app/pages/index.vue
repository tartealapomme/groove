<script lang="ts" setup>
const { openRegister } = useAuthModal()
const { searchReleases } = useDiscogs()
const { getRecommendations } = useRecommendations()

const user = useSupabaseUser()
const { fetchCollection } = useUserCollection()
const { fetchFavorites } = useUserFavorites()

useSeoMeta({
  title: 'GROOV — Le marché du vinyle, centralisé',
  description: 'Agrégateur vinyle : 30M+ pressages mondiaux, filtres par pays, label, état. Trouvez votre pépite.',
  ogTitle: 'GROOV — Le marché du vinyle, centralisé',
  ogDescription: 'Agrégateur vinyle : 30M+ pressages mondiaux.',
})

watch(user, async (u) => {
  if (u) {
    await fetchCollection()
    await fetchFavorites()
  }
}, { immediate: true })

const searchQuery = ref('')
const activeFilter = ref('all')
const isLoading = ref(false)

const filters = [
  { id: 'all', label: 'Tout' },
  { id: 'Rock', label: 'Rock' },
  { id: 'Jazz', label: 'Jazz' },
  { id: 'Electronic', label: 'Electronic' },
  { id: 'Funk / Soul', label: 'Soul / Funk' },
  { id: 'Hip Hop', label: 'Hip-Hop' },
  { id: 'Classical', label: 'Classique' },
]

const { data: searchData, pending: isInitialLoading } = await useAsyncData(
  'home-vinyls',
  () => searchReleases({ per_page: 20, sort: 'want', sort_order: 'desc' }),
  { lazy: true },
)

const { data: personalRecs } = await useAsyncData(
  'home-recommendations',
  () => user.value ? getRecommendations(8) : Promise.resolve([]),
  { lazy: true, watch: [user] },
)

const vinyls = computed(() => {
  if (!searchData.value?.results) return []
  return searchData.value.results.map(r => ({
    id: r.id,
    title: r.title.includes(' - ') ? r.title.split(' - ').slice(1).join(' - ') : r.title,
    artist: r.title.includes(' - ') ? r.title.split(' - ')[0] : '',
    year: r.year || '',
    label: r.label?.[0] || '',
    genre: r.genre?.[0]?.toLowerCase() || '',
    thumb: r.thumb,
    cover: r.cover_image,
    community: r.community,
  }))
})

const filteredVinyls = computed(() => {
  let results = vinyls.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    results = results.filter(v =>
      v.title.toLowerCase().includes(q)
      || (v.artist || '').toLowerCase().includes(q)
      || v.label.toLowerCase().includes(q),
    )
  }
  return results
})

function formatWantCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

const trendingArtists = computed(() => {
  const byArtist = new Map<string, number>()
  for (const v of vinyls.value) {
    const name = (v.artist || '').trim()
    if (!name) continue
    const want = v.community?.want ?? 0
    byArtist.set(name, (byArtist.get(name) ?? 0) + want)
  }
  return [...byArtist.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count: formatWantCount(count) }))
})

async function onFilterChange(genre: string) {
  activeFilter.value = genre
  isLoading.value = true
  try {
    const params: Record<string, string | number> = { per_page: 20, sort: 'want', sort_order: 'desc' }
    if (genre !== 'all') params.genre = genre
    const res = await searchReleases(params)
    searchData.value = res
  }
  finally {
    isLoading.value = false
  }
}

const recsCarouselRef = ref<HTMLElement | null>(null)
function scrollRecs(dir: 'left' | 'right') {
  const el = recsCarouselRef.value
  if (!el) return
  const cardWidth = el.querySelector('[data-rec-card]')?.clientWidth ?? 0
  const gap = 20
  const scrollAmount = (cardWidth + gap) * (dir === 'left' ? -1 : 1)
  el.scrollBy({ left: scrollAmount, behavior: 'smooth' })
}
</script>

<template>
  <div>
    <SubNav />

    <!-- ─── HERO ─── -->
    <section class="border-b border-g-100 px-4 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-14">
      <div class="mx-auto max-w-[1400px]">
        <p class="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-g-400 sm:mb-6 sm:text-xs sm:tracking-[0.25em]">
          GROOV — Agrégateur vinyle
        </p>

        <div class="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <div class="min-w-0 max-w-2xl">
            <h1 class="text-3xl font-bold tracking-tight text-g-950 sm:text-4xl sm:text-5xl lg:text-6xl">
              Le marché du vinyle,
              <br>
              <span class="text-g-400">centralisé.</span>
            </h1>
            <p class="mt-4 max-w-md text-sm leading-relaxed text-g-500 sm:mt-5 sm:text-base">
              30M+ pressages mondiaux agrégés. Filtrez par pays, label, état — trouvez votre pépite sans ouvrir 50 onglets.
            </p>

            <div class="mt-6 flex flex-col gap-4 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center">
              <UButton
                size="md"
                class="min-h-[44px] w-full cursor-pointer rounded-lg bg-g-black px-6 text-sm font-medium text-g-white hover:bg-g-700 sm:w-auto"
                @click="openRegister"
              >
                Commencer gratuitement
              </UButton>
              <div class="flex flex-wrap items-center gap-4 text-xs text-g-400 sm:gap-3">
                <span class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-check" class="h-3.5 w-3.5 shrink-0" />
                  Gratuit
                </span>
                <span class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-check" class="h-3.5 w-3.5 shrink-0" />
                  Alertes illimitées
                </span>
              </div>
            </div>

            <div class="mt-6 md:hidden">
              <div class="flex min-h-[44px] items-center rounded-lg border border-g-200 bg-g-50 px-4 py-2.5">
                <UIcon name="i-lucide-search" class="mr-3 h-4 w-4 shrink-0 text-g-400" />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Rechercher un vinyle…"
                  class="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-g-400"
                >
              </div>
            </div>
          </div>

          <!-- Trending -->
          <div class="shrink-0">
            <span class="mb-2 block text-[11px] font-medium uppercase tracking-[0.2em] text-g-400 sm:mb-3">
              Tendances
            </span>
            <div class="flex flex-wrap gap-2 lg:max-w-xs">
              <button
                v-for="a in trendingArtists"
                :key="a.name"
                class="min-h-[44px] cursor-pointer rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors"
                :class="searchQuery === a.name
                  ? 'border-g-950 bg-g-950 text-g-white'
                  : 'border-g-200 text-g-600 hover:border-g-950 hover:text-g-950'"
                @click="searchQuery = searchQuery === a.name ? '' : a.name"
              >
                {{ a.name }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── PERSONAL RECOMMENDATIONS (carousel) ─── -->
    <section v-if="personalRecs?.length" class="border-b border-g-100 px-4 py-8 sm:px-6 sm:py-10">
      <div class="mx-auto max-w-[1400px]">
        <div class="mb-6 flex items-end justify-between">
          <div>
            <p class="text-[11px] font-medium uppercase tracking-[0.2em] text-g-400 sm:text-xs">Pour vous</p>
            <h2 class="mt-1 text-xl font-bold tracking-tight text-g-950 sm:text-2xl">Recommandations</h2>
          </div>
          <NuxtLink to="/profil" class="cursor-pointer text-xs font-medium text-g-500 transition-colors hover:text-g-950">
            Voir mon profil →
          </NuxtLink>
        </div>
        <div class="relative">
          <button
            type="button"
            class="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-g-200 bg-g-white text-g-600 shadow-lg transition-colors hover:border-g-400 hover:bg-g-50 hover:text-g-950 sm:-left-2"
            aria-label="Précédent"
            @click="scrollRecs('left')"
          >
            <UIcon name="i-lucide-chevron-left" class="h-5 w-5" />
          </button>
          <button
            type="button"
            class="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-g-200 bg-g-white text-g-600 shadow-lg transition-colors hover:border-g-400 hover:bg-g-50 hover:text-g-950 sm:-right-2"
            aria-label="Suivant"
            @click="scrollRecs('right')"
          >
            <UIcon name="i-lucide-chevron-right" class="h-5 w-5" />
          </button>
          <div
            ref="recsCarouselRef"
            class="-mx-4 overflow-x-auto scroll-smooth scroll-snap-x scroll-snap-mandatory scrollbar-none sm:-mx-6"
          >
            <div class="flex gap-3 px-4 pb-2 sm:gap-4 sm:px-6">
              <div
                v-for="rec in personalRecs"
                :key="rec.id"
                data-rec-card
                class="flex shrink-0 flex-col scroll-snap-start"
                :class="[
                  'w-[calc(50%-6px)] sm:w-[calc(33.333%-11px)] md:w-[calc(25%-12px)] lg:w-[calc(20%-16px)]',
                ]"
              >
                <VinylCard
                  :id="rec.id"
                  :title="rec.title"
                  :artist="rec.artist"
                  :year="rec.year"
                  :thumb="rec.thumb"
                  :cover="rec.cover"
                  :community="rec.community"
                />
                <p class="mt-1 truncate text-[10px] text-g-400">{{ rec.reason }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── FILTERS ─── -->
    <div class="sticky top-[6.5rem] z-30 mt-3 border-b border-g-100 bg-g-50/95 backdrop-blur-sm sm:top-[8.5rem]">
      <div class="mx-auto max-w-[1400px]">
        <div class="overflow-x-auto scrollbar-none px-4 sm:px-6">
          <div class="flex min-h-[52px] items-center gap-2 py-3">
            <div class="flex shrink-0 items-center gap-1.5">
              <button
                v-for="f in filters"
                :key="f.id"
                class="min-h-[44px] shrink-0 cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4"
                :class="activeFilter === f.id
                  ? 'bg-g-black text-g-white'
                  : 'text-g-500 hover:bg-g-50 hover:text-g-black'"
                @click="onFilterChange(f.id)"
              >
                {{ f.label }}
              </button>
            </div>
            <span class="mx-2 h-4 w-px shrink-0 bg-g-200" />
            <span class="shrink-0 text-xs text-g-400">{{ filteredVinyls.length }} résultat{{ filteredVinyls.length > 1 ? 's' : '' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── GRID ─── -->
    <main class="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10">
      <div v-if="isLoading || isInitialLoading" class="flex items-center justify-center py-24">
        <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-g-400" />
      </div>

      <div
        v-else-if="filteredVinyls.length"
        class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5"
      >
        <VinylCard
          v-for="vinyl in filteredVinyls"
          :key="vinyl.id"
          :id="vinyl.id"
          :title="vinyl.title"
          :artist="vinyl.artist"
          :year="vinyl.year"
          :label="vinyl.label"
          :genre="vinyl.genre"
          :thumb="vinyl.thumb"
          :cover="vinyl.cover"
          :community="vinyl.community"
        />
      </div>

      <div v-else class="py-16 text-center sm:py-24">
        <UIcon name="i-lucide-disc-3" class="mx-auto mb-4 h-10 w-10 text-g-200 sm:h-12 sm:w-12" />
        <p class="text-sm text-g-500">Aucun résultat trouvé.</p>
        <button
          class="mt-4 cursor-pointer py-3 text-sm text-g-950 underline underline-offset-4 transition-colors hover:text-g-600 sm:mt-3 sm:py-0"
          @click="searchQuery = ''; activeFilter = 'all'"
        >
          Réinitialiser les filtres
        </button>
      </div>

      <div v-if="filteredVinyls.length" class="mt-10 text-center sm:mt-14">
        <NuxtLink to="/explore" class="inline-block">
          <UButton
            size="md"
            class="min-h-[44px] w-full cursor-pointer rounded-lg bg-g-black px-6 text-sm font-medium text-g-white hover:bg-g-700 sm:w-auto sm:px-8"
          >
            Explorer tout le catalogue
          </UButton>
        </NuxtLink>
      </div>
    </main>

    <!-- ─── STATS BAR ─── -->
    <section class="border-y border-g-100 bg-g-50 px-4 py-6 sm:px-6 sm:py-8">
      <div class="mx-auto grid max-w-[1400px] grid-cols-2 gap-6 text-center sm:flex sm:flex-wrap sm:justify-between sm:gap-10">
        <div>
          <p class="text-xl font-bold text-g-950 sm:text-2xl">30M+</p>
          <p class="mt-0.5 text-[11px] text-g-500 sm:text-xs">Pressages indexés</p>
        </div>
        <div>
          <p class="text-xl font-bold text-g-950 sm:text-2xl">180+</p>
          <p class="mt-0.5 text-[11px] text-g-500 sm:text-xs">Pays couverts</p>
        </div>
        <div>
          <p class="text-xl font-bold text-g-950 sm:text-2xl">EU first</p>
          <p class="mt-0.5 text-[11px] text-g-500 sm:text-xs">Filtrage local natif</p>
        </div>
        <div>
          <p class="text-xl font-bold text-g-950 sm:text-2xl">Temps réel</p>
          <p class="mt-0.5 text-[11px] text-g-500 sm:text-xs">Alertes instantanées</p>
        </div>
      </div>
    </section>
  </div>
</template>
