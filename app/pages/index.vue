<script lang="ts" setup>
import logoBlanc from '~/assets/img/groov_logo_blanc.svg'

const { openLogin, openRegister } = useAuthModal()
const { searchReleases } = useDiscogs()
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

const { data: searchData } = await useAsyncData(
  'home-vinyls',
  () => searchReleases({ per_page: 20, sort: 'want', sort_order: 'desc' }),
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
</script>

<template>
  <div class="min-h-screen">
    <!-- ─── NAV (noir) ─── -->
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

    <!-- ─── HERO ─── -->
    <section class="border-b border-g-100 px-6 pb-12 pt-14">
      <div class="mx-auto max-w-[1400px]">
        <!-- Nom de la plateforme -->
        <p class="mb-6 text-xs font-semibold uppercase tracking-[0.25em] text-g-400">
          GROOV — Agrégateur vinyle
        </p>

        <div class="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-2xl">
            <h1 class="text-4xl font-bold tracking-tight text-g-950 sm:text-5xl lg:text-6xl">
              Le marché du vinyle,
              <br>
              <span class="text-g-400">centralisé.</span>
            </h1>
            <p class="mt-5 max-w-md text-base leading-relaxed text-g-500">
              30M+ pressages mondiaux agrégés. Filtrez par pays, label, état — trouvez votre pépite sans ouvrir 50 onglets.
            </p>

            <div class="mt-8 flex flex-wrap items-center gap-4">
              <UButton size="md" class="cursor-pointer rounded-lg bg-g-black px-6 text-sm font-medium text-g-white hover:bg-g-700" @click="openRegister">
                Commencer gratuitement
              </UButton>
              <div class="flex items-center gap-3 text-xs text-g-400">
                <span class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-check" class="h-3.5 w-3.5" />
                  Gratuit
                </span>
                <span class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-check" class="h-3.5 w-3.5" />
                  Alertes illimitées
                </span>
              </div>
            </div>

            <!-- Mobile search -->
            <div class="mt-6 md:hidden">
              <div class="flex items-center rounded-lg border border-g-200 bg-g-50 px-4 py-2.5">
                <UIcon name="i-lucide-search" class="mr-3 h-4 w-4 text-g-400" />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Rechercher un vinyle…"
                  class="w-full bg-transparent text-sm outline-none placeholder:text-g-400"
                >
              </div>
            </div>
          </div>

          <!-- Trending -->
          <div class="shrink-0">
            <span class="mb-3 block text-xs font-medium uppercase tracking-[0.2em] text-g-400">Tendances</span>
            <div class="flex flex-wrap gap-2 lg:max-w-xs">
            <button
              v-for="a in trendingArtists"
              :key="a.name"
              class="cursor-pointer rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors"
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
    <div class="sticky top-[8.5rem] z-30 mt-3 border-b border-g-100 bg-g-50/95 backdrop-blur-sm">
      <div class="mx-auto max-w-[1400px] overflow-x-auto px-6">
        <div class="flex items-center gap-1.5 py-3">
          <button
            v-for="f in filters"
            :key="f.id"
            class="shrink-0 cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            :class="activeFilter === f.id
              ? 'bg-g-black text-g-white'
              : 'text-g-500 hover:bg-g-50 hover:text-g-black'"
            @click="onFilterChange(f.id)"
          >
            {{ f.label }}
          </button>

          <span class="mx-3 h-4 w-px bg-g-200" />
          <span class="text-xs text-g-400">{{ filteredVinyls.length }} résultat{{ filteredVinyls.length > 1 ? 's' : '' }}</span>
        </div>
      </div>
    </div>

    <!-- ─── GRID (fond blanc) ─── -->
    <main class="mx-auto max-w-[1400px] px-6 py-10">
      <!-- Loading -->
      <div v-if="isLoading" class="flex items-center justify-center py-24">
        <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-g-400" />
      </div>

      <div
        v-else-if="filteredVinyls.length"
        class="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
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

            <!-- Add to collection -->
            <button
              class="pointer-events-auto absolute right-2 top-2 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-g-black/50 text-g-white opacity-0 transition-all hover:bg-g-black/80 group-hover:opacity-100"
              title="Ajouter à ma collection"
              @click.prevent="openRegister"
            >
              <UIcon name="i-lucide-plus" class="h-3 w-3" />
              <UIcon name="i-lucide-library-big" class="h-4 w-4" />
            </button>

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
          <div class="mt-3">
            <p class="truncate text-sm font-semibold text-g-950">{{ vinyl.title }}</p>
            <p class="mt-0.5 truncate text-xs text-g-500">{{ vinyl.artist }}</p>
            <div class="mt-2 flex items-center justify-between">
              <span class="text-[11px] text-g-400">{{ vinyl.label }} · {{ vinyl.year }}</span>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Empty state -->
      <div v-else class="py-24 text-center">
        <UIcon name="i-lucide-disc-3" class="mx-auto mb-4 h-12 w-12 text-g-200" />
        <p class="text-sm text-g-500">Aucun résultat trouvé.</p>
        <button
          class="mt-3 cursor-pointer text-sm text-g-950 underline underline-offset-4 transition-colors hover:text-g-600"
          @click="searchQuery = ''; activeFilter = 'all'"
        >
          Réinitialiser les filtres
        </button>
      </div>

      <!-- Voir tout -->
      <div v-if="filteredVinyls.length" class="mt-14 text-center">
        <NuxtLink to="/explore">
          <UButton
            size="md"
            class="cursor-pointer rounded-lg bg-g-black px-8 text-sm font-medium text-g-white hover:bg-g-700"
          >
            Explorer tout le catalogue
          </UButton>
        </NuxtLink>
      </div>
    </main>

    <!-- ─── STATS BAR ─── -->
    <section class="border-y border-g-100 bg-g-50 px-35 py-8">
      <div class="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-10 text-center sm:justify-between">
        <div>
          <p class="text-2xl font-bold text-g-950">30M+</p>
          <p class="mt-0.5 text-xs text-g-500">Pressages indexés</p>
        </div>
        <div>
          <p class="text-2xl font-bold text-g-950">180+</p>
          <p class="mt-0.5 text-xs text-g-500">Pays couverts</p>
        </div>
        <div>
          <p class="text-2xl font-bold text-g-950">EU first</p>
          <p class="mt-0.5 text-xs text-g-500">Filtrage local natif</p>
        </div>
        <div>
          <p class="text-2xl font-bold text-g-950">Temps réel</p>
          <p class="mt-0.5 text-xs text-g-500">Alertes instantanées</p>
        </div>
      </div>
    </section>

    <AppFooter />
  </div>
</template>
