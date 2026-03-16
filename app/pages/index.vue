<script lang="ts" setup>
import type { Database } from '~/database.types'

const { openRegister } = useAuthModal()
const { searchReleases } = useDiscogs()

// Charger collection et favoris pour les utilisateurs connectés
const user = useSupabaseUser()
const { fetchCollection } = useUserCollection()
const { fetchFavorites } = useUserFavorites()
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

const supabase = useSupabaseClient<Database>()

const { data: searchData, pending: isInitialLoading } = await useAsyncData(
  'home-vinyls',
  () => searchReleases({ per_page: 20, sort: 'want', sort_order: 'desc' }),
  { lazy: true },
)

const { data: editorialTrends } = await useAsyncData(
  'editorial-trends',
  async () => {
    const { data, error } = await supabase
      .from('homepage_trends')
      .select('*')
      .order('position', { ascending: true })
    if (error) {
      console.error('[groov] homepage_trends error', error)
      return []
    }
    return data || []
  },
  { lazy: true },
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
  if (editorialTrends.value?.length) {
    return editorialTrends.value.map(t => ({
      name: t.title,
      artist: t.artist,
    }))
  }

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
</script>

<template>
  <div class="min-h-screen overflow-x-hidden pb-[env(safe-area-inset-bottom,0px)]">
    <AppHeader />

    <SubNav />

    <!-- ─── HERO ─── -->
    <section class="border-b border-g-100 px-4 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-14">
      <div class="mx-auto max-w-[1400px]">
        <!-- Nom de la plateforme -->
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

            <!-- Mobile search -->
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

    <!-- ─── FILTERS (fond blanc) ─── -->
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

    <!-- ─── GRID (fond blanc) ─── -->
    <main class="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10">
      <!-- Loading -->
      <div v-if="isLoading || isInitialLoading" class="flex items-center justify-center py-24">
        <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-g-400" />
      </div>

      <div
        v-else-if="filteredVinyls.length"
        class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5"
      >
        <NuxtLink
          v-for="vinyl in filteredVinyls"
          :key="vinyl.id"
          :to="`/vinyl/${vinyl.id}`"
          class="group cursor-pointer"
        >
          <!-- Cover -->
          <div class="relative aspect-square overflow-hidden rounded-lg bg-g-100">
            <img
              v-if="vinyl.cover || vinyl.thumb"
              :src="vinyl.cover || vinyl.thumb"
              :alt="vinyl.title"
              class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            >
            <div v-else class="flex h-full w-full items-center justify-center bg-g-200">
              <span class="text-4xl font-black text-g-400/30 sm:text-5xl">
                {{ (vinyl.artist || '').split(' ').map((w: string) => w[0]).join('') }}
              </span>
            </div>

            <VinylCardActions
              :discogs-id="vinyl.id"
              :title="vinyl.title"
              :artist="vinyl.artist"
              :thumb="vinyl.thumb"
              :cover="vinyl.cover"
              :label="vinyl.label"
              :genre="vinyl.genre"
              :year="vinyl.year"
            />

            <!-- Hover overlay -->
            <div class="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-g-black/80 via-g-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <div class="flex w-full items-end justify-between p-3">
                <span v-if="vinyl.community" class="rounded-lg bg-g-black/40 px-2 py-1 text-[11px] font-medium text-g-white">
                  {{ vinyl.community.want }} wants
                </span>
                <span class="rounded-lg bg-g-black/40 px-2 py-1 text-[11px] font-medium text-g-white">
                  Voir →
                </span>
              </div>
            </div>
          </div>

          <!-- Info -->
          <div class="mt-2 min-w-0 sm:mt-3">
            <p class="truncate text-sm font-semibold text-g-950">{{ vinyl.title }}</p>
            <p class="mt-0.5 truncate text-xs text-g-500">{{ vinyl.artist }}</p>
            <div class="mt-1.5 flex items-center justify-between sm:mt-2">
              <span class="truncate text-[11px] text-g-400">{{ vinyl.label }} · {{ vinyl.year }}</span>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Empty state -->
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

      <!-- Voir tout -->
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

    <AppFooter />
  </div>
</template>
