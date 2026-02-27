<script lang="ts" setup>
import logoBlanc from '~/assets/img/groov_logo_blanc.svg'

const { openLogin, openRegister } = useAuthModal()
const { searchReleases } = useDiscogs()
const searchQuery = ref('')
const route = useRoute()
const isLoading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)

const activeGenre = ref((route.query.genre as string) || 'all')
const activeDecade = ref('all')
const activeSort = ref('year')
const activeSortOrder = ref('desc')
const showFilters = ref(true)

watch(() => route.query.genre, (genre) => {
  activeGenre.value = (genre as string) || 'all'
  fetchResults()
})

const genres = [
  { id: 'all', label: 'Tous les genres' },
  { id: 'Rock', label: 'Rock' },
  { id: 'Jazz', label: 'Jazz' },
  { id: 'Electronic', label: 'Electronic' },
  { id: 'Funk / Soul', label: 'Soul / Funk' },
  { id: 'Hip Hop', label: 'Hip-Hop' },
  { id: 'Classical', label: 'Classique' },
  { id: 'Pop', label: 'Pop' },
  { id: 'Reggae', label: 'Reggae' },
]

const decades = [
  { id: 'all', label: 'Toutes les décennies' },
  { id: '2020', label: '2020s' },
  { id: '2010', label: '2010s' },
  { id: '2000', label: '2000s' },
  { id: '1990', label: '1990s' },
  { id: '1980', label: '1980s' },
  { id: '1970', label: '1970s' },
  { id: '1960', label: '1960s' },
  { id: '1950', label: '1950s' },
]

const sortOptions = [
  { id: 'year-desc', sort: 'year', order: 'desc', label: 'Plus récent' },
  { id: 'year-asc', sort: 'year', order: 'asc', label: 'Plus ancien' },
  { id: 'title-asc', sort: 'title', order: 'asc', label: 'Titre A-Z' },
  { id: 'title-desc', sort: 'title', order: 'desc', label: 'Titre Z-A' },
]

const activeSortId = computed(() => `${activeSort.value}-${activeSortOrder.value}`)

interface VinylCard {
  id: number
  title: string
  artist: string
  year: string
  label: string
  genre: string
  thumb: string
  cover: string
  community: { want: number, have: number }
}

const results = ref<VinylCard[]>([])

function parseResult(r: { id: number, title: string, thumb: string, cover_image: string, year: string, label: string[], genre: string[], community: { want: number, have: number } }): VinylCard {
  return {
    id: r.id,
    title: r.title.includes(' - ') ? r.title.split(' - ').slice(1).join(' - ') : r.title,
    artist: r.title.includes(' - ') ? r.title.split(' - ')[0] : '',
    year: r.year || '',
    label: r.label?.[0] || '',
    genre: r.genre?.[0]?.toLowerCase() || '',
    thumb: r.thumb,
    cover: r.cover_image,
    community: r.community,
  }
}

async function fetchResults() {
  isLoading.value = true
  try {
    const params: Record<string, string | number | undefined> = {
      per_page: 24,
      page: currentPage.value,
      sort: activeSort.value,
      sort_order: activeSortOrder.value,
    }
    if (activeGenre.value !== 'all') params.genre = activeGenre.value
    if (activeDecade.value !== 'all') params.year = activeDecade.value
    if (searchQuery.value.trim()) params.q = searchQuery.value.trim()

    const res = await searchReleases(params)
    results.value = res.results.map(parseResult)
    totalPages.value = res.pagination.pages
    totalItems.value = res.pagination.items
  }
  catch {
    results.value = []
  }
  finally {
    isLoading.value = false
  }
}

const { data: initialData } = await useAsyncData('explore-vinyls', () => {
  const params: Record<string, string | number | undefined> = { per_page: 24, sort: 'year', sort_order: 'desc' }
  if (route.query.genre) params.genre = route.query.genre as string
  return searchReleases(params)
})

if (initialData.value) {
  results.value = initialData.value.results.map(parseResult)
  totalPages.value = initialData.value.pagination.pages
  totalItems.value = initialData.value.pagination.items
}

function onGenreChange(genre: string) {
  activeGenre.value = genre
  currentPage.value = 1
  fetchResults()
}

function onDecadeChange(decade: string) {
  activeDecade.value = decade
  currentPage.value = 1
  fetchResults()
}

function onSortChange(opt: { sort: string, order: string }) {
  activeSort.value = opt.sort
  activeSortOrder.value = opt.order
  currentPage.value = 1
  fetchResults()
}

function onPageChange(page: number) {
  currentPage.value = page
  fetchResults()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const activeFiltersCount = computed(() => {
  let count = 0
  if (activeGenre.value !== 'all') count++
  if (activeDecade.value !== 'all') count++
  return count
})

function resetFilters() {
  activeGenre.value = 'all'
  activeDecade.value = 'all'
  searchQuery.value = ''
  activeSort.value = 'year'
  activeSortOrder.value = 'desc'
  currentPage.value = 1
  fetchResults()
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchResults()
  }, 400)
})
</script>

<template>
  <div class="min-h-screen">
    <!-- ─── NAV ─── -->
    <nav class="sticky inset-x-0 top-0 z-50 bg-g-black">
      <div class="mx-auto flex h-24 max-w-[1400px] items-center justify-between px-6">
        <NuxtLink to="/" class="shrink-0 cursor-pointer">
          <img :src="logoBlanc" alt="GROOV" class="h-9">
        </NuxtLink>

        <div class="mx-8 hidden max-w-xl flex-1 md:block">
          <SearchBar />
        </div>

        <div class="flex items-center gap-7">
          <button class="cursor-pointer text-[15px] text-g-400 transition-colors hover:text-g-white" @click="openLogin">
            Connexion
          </button>
          <UButton size="md" class="cursor-pointer rounded-lg bg-g-white px-5 text-[15px] font-medium text-g-black hover:bg-g-200" @click="openRegister">
            S'inscrire
          </UButton>
        </div>
      </div>
    </nav>

    <SubNav />

    <!-- ─── PAGE HEADER ─── -->
    <div class="border-b border-g-100 px-6 py-8">
      <div class="mx-auto max-w-[1400px]">
        <div class="flex items-end justify-between">
          <div>
            <h1 class="text-3xl font-bold tracking-tight text-g-950">Explorer</h1>
            <p class="mt-1 text-sm text-g-400">{{ totalItems.toLocaleString('fr-FR') }} vinyle{{ totalItems > 1 ? 's' : '' }} trouvé{{ totalItems > 1 ? 's' : '' }}</p>
          </div>

          <!-- Mobile search -->
          <div class="md:hidden">
            <div class="flex items-center rounded-lg border border-g-200 bg-g-white px-3 py-2">
              <UIcon name="i-lucide-search" class="mr-2 h-4 w-4 text-g-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Rechercher…"
                class="w-full bg-transparent text-sm outline-none placeholder:text-g-400"
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── CONTENT ─── -->
    <div class="mx-auto max-w-[1400px] px-6 py-8">
      <div class="flex gap-8">
        <!-- ─── SIDEBAR FILTERS ─── -->
        <aside class="hidden w-56 shrink-0 lg:block">
          <div class="sticky top-36">
            <!-- Search -->
            <div class="mb-5">
              <SearchBar variant="light" />
            </div>

            <!-- Toggle + Reset -->
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-sm font-semibold text-g-950">Filtres</h2>
              <button
                v-if="activeFiltersCount > 0"
                class="cursor-pointer text-xs text-g-400 underline underline-offset-4 transition-colors hover:text-g-950"
                @click="resetFilters"
              >
                Réinitialiser ({{ activeFiltersCount }})
              </button>
            </div>

            <!-- Genre -->
            <details class="group border-b border-g-100 pb-3 mb-3" open>
              <summary class="flex cursor-pointer items-center justify-between py-1.5 text-xs font-medium uppercase tracking-[0.15em] text-g-400 select-none">
                Genre
                <UIcon name="i-lucide-chevron-down" class="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
              </summary>
              <div class="mt-2 space-y-0.5">
                <button
                  v-for="g in genres"
                  :key="g.id"
                  class="flex w-full cursor-pointer items-center rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors"
                  :class="activeGenre === g.id
                    ? 'bg-g-black font-medium text-g-white'
                    : 'text-g-500 hover:bg-g-100 hover:text-g-950'"
                  @click="onGenreChange(g.id)"
                >
                  {{ g.label }}
                </button>
              </div>
            </details>

            <!-- Decade -->
            <details class="group pb-3">
              <summary class="flex cursor-pointer items-center justify-between py-1.5 text-xs font-medium uppercase tracking-[0.15em] text-g-400 select-none">
                Décennie
                <UIcon name="i-lucide-chevron-down" class="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
              </summary>
              <div class="mt-2 space-y-0.5">
                <button
                  v-for="d in decades"
                  :key="d.id"
                  class="flex w-full cursor-pointer items-center rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors"
                  :class="activeDecade === d.id
                    ? 'bg-g-black font-medium text-g-white'
                    : 'text-g-500 hover:bg-g-100 hover:text-g-950'"
                  @click="onDecadeChange(d.id)"
                >
                  {{ d.label }}
                </button>
              </div>
            </details>
          </div>
        </aside>

        <!-- ─── MOBILE FILTERS ─── -->
        <div class="mb-4 flex flex-wrap gap-2 lg:hidden">
          <button
            class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-g-200 px-3 py-1.5 text-xs font-medium text-g-500 transition-colors hover:border-g-950 hover:text-g-950"
            @click="showFilters = !showFilters"
          >
            <UIcon name="i-lucide-sliders-horizontal" class="h-3.5 w-3.5" />
            Filtres
            <span v-if="activeFiltersCount > 0" class="rounded-lg bg-g-black px-1.5 text-g-white">{{ activeFiltersCount }}</span>
          </button>
        </div>

        <!-- ─── MAIN ─── -->
        <div class="flex-1">
          <!-- Sort bar -->
          <div class="mb-6 flex items-center justify-between">
            <div class="flex gap-1.5 overflow-x-auto">
              <button
                v-for="s in sortOptions"
                :key="s.id"
                class="shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                :class="activeSortId === s.id
                  ? 'bg-g-black text-g-white'
                  : 'text-g-400 hover:bg-g-100 hover:text-g-950'"
                @click="onSortChange(s)"
              >
                {{ s.label }}
              </button>
            </div>

            <!-- Active filters tags (desktop) -->
            <div class="hidden items-center gap-2 lg:flex">
              <span
                v-if="activeGenre !== 'all'"
                class="flex cursor-pointer items-center gap-1 rounded-lg border border-g-200 px-2.5 py-1 text-xs text-g-500 transition-colors hover:border-g-950"
                @click="onGenreChange('all')"
              >
                {{ genres.find(g => g.id === activeGenre)?.label }}
                <UIcon name="i-lucide-x" class="h-3 w-3" />
              </span>
              <span
                v-if="activeDecade !== 'all'"
                class="flex cursor-pointer items-center gap-1 rounded-lg border border-g-200 px-2.5 py-1 text-xs text-g-500 transition-colors hover:border-g-950"
                @click="onDecadeChange('all')"
              >
                {{ decades.find(d => d.id === activeDecade)?.label }}
                <UIcon name="i-lucide-x" class="h-3 w-3" />
              </span>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="isLoading" class="flex items-center justify-center py-24">
            <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-g-400" />
          </div>

          <!-- Grid -->
          <div
            v-else-if="results.length"
            class="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4"
          >
            <NuxtLink
              v-for="vinyl in results"
              :key="vinyl.id"
              :to="`/vinyl/${vinyl.id}`"
              class="group cursor-pointer"
            >
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
                    {{ vinyl.artist.split(' ').map((w: string) => w[0]).join('') }}
                  </span>
                </div>

                <!-- Add to collection -->
                <button
                  class="pointer-events-auto absolute right-2 top-2 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-g-black/50 text-g-white opacity-0 transition-all hover:bg-g-black/80 group-hover:opacity-100"
                  title="Ajouter à ma collection"
                  @click.prevent="openRegister"
                >
                  <UIcon name="i-lucide-plus" class="h-3 w-3" />
                  <UIcon name="i-lucide-library-big" class="h-4 w-4" />
                </button>

                <div class="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-g-black/80 via-g-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <div class="flex w-full items-end justify-between p-3">
                    <span v-if="vinyl.community" class="rounded-lg bg-g-black/40 px-2 py-1 text-[11px] font-medium text-g-white">
                      {{ vinyl.community.want }} wants · {{ vinyl.community.have }} have
                    </span>
                    <span class="rounded-lg bg-g-black/40 px-2 py-1 text-[11px] font-medium text-g-white">
                      Voir →
                    </span>
                  </div>
                </div>
              </div>

              <div class="mt-3">
                <p class="truncate text-sm font-semibold text-g-950">{{ vinyl.title }}</p>
                <p class="mt-0.5 truncate text-xs text-g-500">{{ vinyl.artist }}</p>
                <div class="mt-2 flex items-center justify-between">
                  <span class="text-[11px] text-g-400">{{ vinyl.label }} · {{ vinyl.year }}</span>
                </div>
              </div>
            </NuxtLink>
          </div>

          <!-- Pagination -->
          <div v-if="!isLoading && results.length && totalPages > 1" class="mt-10 flex items-center justify-center gap-2">
            <button
              class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-g-200 text-g-500 transition-colors hover:border-g-950 hover:text-g-950 disabled:pointer-events-none disabled:opacity-30"
              :disabled="currentPage <= 1"
              @click="onPageChange(currentPage - 1)"
            >
              <UIcon name="i-lucide-chevron-left" class="h-4 w-4" />
            </button>
            <span class="px-3 text-sm text-g-500">
              Page {{ currentPage }} / {{ totalPages }}
            </span>
            <button
              class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-g-200 text-g-500 transition-colors hover:border-g-950 hover:text-g-950 disabled:pointer-events-none disabled:opacity-30"
              :disabled="currentPage >= totalPages"
              @click="onPageChange(currentPage + 1)"
            >
              <UIcon name="i-lucide-chevron-right" class="h-4 w-4" />
            </button>
          </div>

          <!-- Empty state -->
          <div v-if="!isLoading && !results.length" class="py-24 text-center">
            <UIcon name="i-lucide-disc-3" class="mx-auto mb-4 h-12 w-12 text-g-200" />
            <p class="text-sm text-g-500">Aucun vinyle ne correspond à vos critères.</p>
            <button
              class="mt-3 cursor-pointer text-sm text-g-950 underline underline-offset-4 transition-colors hover:text-g-600"
              @click="resetFilters"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      </div>
    </div>

    <AppFooter />
  </div>
</template>
