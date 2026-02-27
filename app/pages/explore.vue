<script lang="ts" setup>
import logoBlanc from '~/assets/img/groov_logo_blanc.svg'
import logoNoir from '~/assets/img/groov_logo_noir.svg'

const { openLogin, openRegister } = useAuthModal()
const searchQuery = ref('')
const route = useRoute()

// Filtres
const activeGenre = ref((route.query.genre as string) || 'all')
const activeCondition = ref('all')
const activeDecade = ref('all')
const activeSort = ref('pertinence')
const showFilters = ref(true)

watch(() => route.query.genre, (genre) => {
  activeGenre.value = (genre as string) || 'all'
})

const genres = [
  { id: 'all', label: 'Tous les genres' },
  { id: 'rock', label: 'Rock' },
  { id: 'jazz', label: 'Jazz' },
  { id: 'electronic', label: 'Électronique' },
  { id: 'soul', label: 'Soul / Funk' },
  { id: 'hiphop', label: 'Hip-Hop' },
  { id: 'classical', label: 'Classique' },
  { id: 'pop', label: 'Pop' },
  { id: 'reggae', label: 'Reggae' },
]

const conditions = [
  { id: 'all', label: 'Tout état' },
  { id: 'M', label: 'Mint (M)' },
  { id: 'NM', label: 'Near Mint (NM)' },
  { id: 'VG+', label: 'Very Good+ (VG+)' },
  { id: 'VG', label: 'Very Good (VG)' },
  { id: 'G', label: 'Good (G)' },
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
  { id: 'pertinence', label: 'Pertinence' },
  { id: 'price-asc', label: 'Prix croissant' },
  { id: 'price-desc', label: 'Prix décroissant' },
  { id: 'year-desc', label: 'Plus récent' },
  { id: 'year-asc', label: 'Plus ancien' },
]

const allVinyls = [
  { id: 'dark-side-of-the-moon', title: 'The Dark Side of the Moon', artist: 'Pink Floyd', year: '1973', label: 'Harvest', condition: 'NM', price: 285, priceDisplay: '€285', genre: 'rock', color: '#1a1a2e', sellers: 24 },
  { id: 'kind-of-blue', title: 'Kind of Blue', artist: 'Miles Davis', year: '1959', label: 'Columbia', condition: 'VG+', price: 420, priceDisplay: '€420', genre: 'jazz', color: '#0f3460', sellers: 18 },
  { id: 'discovery', title: 'Discovery', artist: 'Daft Punk', year: '2001', label: 'Virgin', condition: 'NM', price: 95, priceDisplay: '€95', genre: 'electronic', color: '#e94560', sellers: 31 },
  { id: 'ok-computer', title: 'OK Computer', artist: 'Radiohead', year: '1997', label: 'Parlophone', condition: 'NM', price: 145, priceDisplay: '€145', genre: 'rock', color: '#533483', sellers: 22 },
  { id: 'rumours', title: 'Rumours', artist: 'Fleetwood Mac', year: '1977', label: 'Warner Bros', condition: 'VG+', price: 68, priceDisplay: '€68', genre: 'rock', color: '#4a3728', sellers: 45 },
  { id: 'whats-going-on', title: "What's Going On", artist: 'Marvin Gaye', year: '1971', label: 'Tamla', condition: 'VG', price: 180, priceDisplay: '€180', genre: 'soul', color: '#2d6a4f', sellers: 12 },
  { id: 'homework', title: 'Homework', artist: 'Daft Punk', year: '1997', label: 'Virgin', condition: 'NM', price: 110, priceDisplay: '€110', genre: 'electronic', color: '#d4a373', sellers: 27 },
  { id: 'head-hunters', title: 'Head Hunters', artist: 'Herbie Hancock', year: '1973', label: 'Columbia', condition: 'VG+', price: 55, priceDisplay: '€55', genre: 'jazz', color: '#bc6c25', sellers: 14 },
  { id: 'illmatic', title: 'Illmatic', artist: 'Nas', year: '1994', label: 'Columbia', condition: 'NM', price: 75, priceDisplay: '€75', genre: 'hiphop', color: '#6b705c', sellers: 33 },
  { id: 'loveless', title: 'Loveless', artist: 'My Bloody Valentine', year: '1991', label: 'Creation', condition: 'VG+', price: 320, priceDisplay: '€320', genre: 'rock', color: '#c9184a', sellers: 8 },
  { id: 'abbey-road', title: 'Abbey Road', artist: 'The Beatles', year: '1969', label: 'Apple', condition: 'VG+', price: 195, priceDisplay: '€195', genre: 'rock', color: '#5c7a99', sellers: 52 },
  { id: 'blue-train', title: 'Blue Train', artist: 'John Coltrane', year: '1958', label: 'Blue Note', condition: 'VG', price: 380, priceDisplay: '€380', genre: 'jazz', color: '#1a365d', sellers: 9 },
  { id: 'random-access-memories', title: 'Random Access Memories', artist: 'Daft Punk', year: '2013', label: 'Columbia', condition: 'NM', price: 45, priceDisplay: '€45', genre: 'electronic', color: '#2d2d2d', sellers: 41 },
  { id: 'the-miseducation', title: 'The Miseducation of Lauryn Hill', artist: 'Lauryn Hill', year: '1998', label: 'Ruffhouse', condition: 'VG+', price: 85, priceDisplay: '€85', genre: 'hiphop', color: '#8b6f47', sellers: 19 },
  { id: 'remain-in-light', title: 'Remain in Light', artist: 'Talking Heads', year: '1980', label: 'Sire', condition: 'NM', price: 130, priceDisplay: '€130', genre: 'rock', color: '#c44536', sellers: 16 },
  { id: 'innervisions', title: 'Innervisions', artist: 'Stevie Wonder', year: '1973', label: 'Tamla', condition: 'VG', price: 90, priceDisplay: '€90', genre: 'soul', color: '#6b4226', sellers: 21 },
  { id: 'selected-ambient', title: 'Selected Ambient Works 85-92', artist: 'Aphex Twin', year: '1992', label: 'Apollo', condition: 'NM', price: 175, priceDisplay: '€175', genre: 'electronic', color: '#4a6741', sellers: 11 },
  { id: 'in-a-silent-way', title: 'In a Silent Way', artist: 'Miles Davis', year: '1969', label: 'Columbia', condition: 'VG+', price: 220, priceDisplay: '€220', genre: 'jazz', color: '#2c5f7c', sellers: 15 },
  { id: 'pet-sounds', title: 'Pet Sounds', artist: 'The Beach Boys', year: '1966', label: 'Capitol', condition: 'VG', price: 260, priceDisplay: '€260', genre: 'pop', color: '#5fa052', sellers: 13 },
  { id: 'ready-to-die', title: 'Ready to Die', artist: 'The Notorious B.I.G.', year: '1994', label: 'Bad Boy', condition: 'NM', price: 155, priceDisplay: '€155', genre: 'hiphop', color: '#8b0000', sellers: 20 },
]

function getDecade(year: string) {
  return `${year.substring(0, 3)}0`
}

const filteredVinyls = computed(() => {
  let results = [...allVinyls]

  if (activeGenre.value !== 'all') {
    results = results.filter(v => v.genre === activeGenre.value)
  }
  if (activeCondition.value !== 'all') {
    results = results.filter(v => v.condition === activeCondition.value)
  }
  if (activeDecade.value !== 'all') {
    results = results.filter(v => getDecade(v.year) === activeDecade.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    results = results.filter(v =>
      v.title.toLowerCase().includes(q)
      || v.artist.toLowerCase().includes(q)
      || v.label.toLowerCase().includes(q),
    )
  }

  switch (activeSort.value) {
    case 'price-asc':
      results.sort((a, b) => a.price - b.price)
      break
    case 'price-desc':
      results.sort((a, b) => b.price - a.price)
      break
    case 'year-desc':
      results.sort((a, b) => Number(b.year) - Number(a.year))
      break
    case 'year-asc':
      results.sort((a, b) => Number(a.year) - Number(b.year))
      break
  }

  return results
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (activeGenre.value !== 'all') count++
  if (activeCondition.value !== 'all') count++
  if (activeDecade.value !== 'all') count++
  return count
})

function resetFilters() {
  activeGenre.value = 'all'
  activeCondition.value = 'all'
  activeDecade.value = 'all'
  searchQuery.value = ''
  activeSort.value = 'pertinence'
}
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
          <div class="flex items-center rounded-lg border border-g-500 bg-g-700 px-4 py-2.5 transition-colors focus-within:border-g-400 focus-within:bg-g-600">
            <UIcon name="i-lucide-search" class="mr-2.5 h-[18px] w-[18px] shrink-0 text-g-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Artiste, album, label, pressage…"
              class="w-full bg-transparent text-[15px] text-g-white outline-none placeholder:text-g-400"
            >
          </div>
        </div>

        <div class="flex items-center gap-7">
          <button class="cursor-pointer text-[15px] text-g-400 transition-colors hover:text-g-white" @click="openLogin">
            Connexion
          </button>
          <UButton size="md" class="cursor-pointer rounded-lg bg-g-white px-5 text-[15px] font-medium text-g-black hover:bg-g-200" @click="openRegister">
            S'inscrire
          </UButton>
          <NuxtLink to="/" class="flex cursor-pointer items-center text-g-400 transition-colors hover:text-g-white">
            <UIcon name="i-lucide-shopping-bag" class="h-5 w-5" />
          </NuxtLink>
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
            <p class="mt-1 text-sm text-g-400">{{ filteredVinyls.length }} vinyle{{ filteredVinyls.length > 1 ? 's' : '' }} disponible{{ filteredVinyls.length > 1 ? 's' : '' }}</p>
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
          <div class="sticky top-28">
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
                  class="flex w-full cursor-pointer items-center rounded-lg px-2.5 py-1.5 text-left text-sm transition-all"
                  :class="activeGenre === g.id
                    ? 'bg-g-black font-medium text-g-white'
                    : 'text-g-500 hover:bg-g-100 hover:text-g-950'"
                  @click="activeGenre = g.id"
                >
                  {{ g.label }}
                </button>
              </div>
            </details>

            <!-- Condition -->
            <details class="group border-b border-g-100 pb-3 mb-3" open>
              <summary class="flex cursor-pointer items-center justify-between py-1.5 text-xs font-medium uppercase tracking-[0.15em] text-g-400 select-none">
                État
                <UIcon name="i-lucide-chevron-down" class="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
              </summary>
              <div class="mt-2 space-y-0.5">
                <button
                  v-for="c in conditions"
                  :key="c.id"
                  class="flex w-full cursor-pointer items-center rounded-lg px-2.5 py-1.5 text-left text-sm transition-all"
                  :class="activeCondition === c.id
                    ? 'bg-g-black font-medium text-g-white'
                    : 'text-g-500 hover:bg-g-100 hover:text-g-950'"
                  @click="activeCondition = c.id"
                >
                  {{ c.label }}
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
                  class="flex w-full cursor-pointer items-center rounded-lg px-2.5 py-1.5 text-left text-sm transition-all"
                  :class="activeDecade === d.id
                    ? 'bg-g-black font-medium text-g-white'
                    : 'text-g-500 hover:bg-g-100 hover:text-g-950'"
                  @click="activeDecade = d.id"
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
            class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-g-200 px-3 py-1.5 text-xs font-medium text-g-500 transition-all hover:border-g-950 hover:text-g-950"
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
                class="shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                :class="activeSort === s.id
                  ? 'bg-g-black text-g-white'
                  : 'text-g-400 hover:bg-g-100 hover:text-g-950'"
                @click="activeSort = s.id"
              >
                {{ s.label }}
              </button>
            </div>

            <!-- Active filters tags (desktop) -->
            <div class="hidden items-center gap-2 lg:flex">
              <span
                v-if="activeGenre !== 'all'"
                class="flex cursor-pointer items-center gap-1 rounded-lg border border-g-200 px-2.5 py-1 text-xs text-g-500 transition-colors hover:border-g-950"
                @click="activeGenre = 'all'"
              >
                {{ genres.find(g => g.id === activeGenre)?.label }}
                <UIcon name="i-lucide-x" class="h-3 w-3" />
              </span>
              <span
                v-if="activeCondition !== 'all'"
                class="flex cursor-pointer items-center gap-1 rounded-lg border border-g-200 px-2.5 py-1 text-xs text-g-500 transition-colors hover:border-g-950"
                @click="activeCondition = 'all'"
              >
                {{ conditions.find(c => c.id === activeCondition)?.label }}
                <UIcon name="i-lucide-x" class="h-3 w-3" />
              </span>
              <span
                v-if="activeDecade !== 'all'"
                class="flex cursor-pointer items-center gap-1 rounded-lg border border-g-200 px-2.5 py-1 text-xs text-g-500 transition-colors hover:border-g-950"
                @click="activeDecade = 'all'"
              >
                {{ decades.find(d => d.id === activeDecade)?.label }}
                <UIcon name="i-lucide-x" class="h-3 w-3" />
              </span>
            </div>
          </div>

          <!-- Grid -->
          <div
            v-if="filteredVinyls.length"
            class="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4"
          >
            <NuxtLink
              v-for="vinyl in filteredVinyls"
              :key="vinyl.id"
              :to="`/vinyl/${vinyl.id}`"
              class="group cursor-pointer"
            >
              <div class="relative aspect-square overflow-hidden rounded-lg" :style="{ backgroundColor: vinyl.color }">
                <div class="flex h-full w-full items-center justify-center">
                  <span class="text-4xl font-black text-white/20 sm:text-5xl">
                    {{ vinyl.artist.split(' ').map(w => w[0]).join('') }}
                  </span>
                </div>

                <div class="absolute inset-0 flex items-end bg-gradient-to-t from-g-black/80 via-g-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <div class="flex w-full items-end justify-between p-3">
                    <span class="rounded-lg bg-g-white px-2.5 py-1 text-xs font-bold text-g-black">
                      {{ vinyl.priceDisplay }}
                    </span>
                    <span class="rounded-lg bg-g-white/20 px-2 py-1 text-[11px] font-medium text-g-white backdrop-blur-sm">
                      Voir →
                    </span>
                  </div>
                </div>

                <div class="absolute right-2.5 top-2.5">
                  <span class="rounded-lg bg-g-black/50 px-2 py-0.5 font-[family-name:var(--font-mono)] text-[11px] font-medium text-g-white backdrop-blur-sm">
                    {{ vinyl.condition }}
                  </span>
                </div>
              </div>

              <div class="mt-3">
                <p class="truncate text-sm font-semibold text-g-950">{{ vinyl.title }}</p>
                <p class="mt-0.5 truncate text-xs text-g-500">{{ vinyl.artist }}</p>
                <div class="mt-2 flex items-center justify-between">
                  <span class="text-sm font-bold text-g-950">{{ vinyl.priceDisplay }}</span>
                  <span class="text-[11px] text-g-400">{{ vinyl.label }} · {{ vinyl.year }}</span>
                </div>
                <p class="mt-1 text-[11px] text-g-300">{{ vinyl.sellers }} vendeur{{ vinyl.sellers > 1 ? 's' : '' }}</p>
              </div>
            </NuxtLink>
          </div>

          <!-- Empty state -->
          <div v-else class="py-24 text-center">
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

    <!-- ─── FOOTER ─── -->
    <footer class="border-t border-g-100 px-6 py-8">
      <div class="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 sm:flex-row">
        <img :src="logoNoir" alt="GROOV" class="h-5 opacity-30">
        <div class="flex gap-6">
          <NuxtLink to="#" class="cursor-pointer text-xs text-g-400 transition-colors hover:text-g-950">À propos</NuxtLink>
          <NuxtLink to="#" class="cursor-pointer text-xs text-g-400 transition-colors hover:text-g-950">Contact</NuxtLink>
          <NuxtLink to="#" class="cursor-pointer text-xs text-g-400 transition-colors hover:text-g-950">CGU</NuxtLink>
        </div>
        <p class="text-[11px] text-g-400">Discogs API · Supabase · Vercel · © 2026</p>
      </div>
    </footer>
  </div>
</template>
