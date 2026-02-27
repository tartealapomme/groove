<script lang="ts" setup>
import logoBlanc from '~/assets/img/groov_logo_blanc.svg'
import logoNoir from '~/assets/img/groov_logo_noir.svg'

const { openLogin, openRegister } = useAuthModal()
const searchQuery = ref('')
const activeFilter = ref('all')

const filters = [
  { id: 'all', label: 'Tout' },
  { id: 'rock', label: 'Rock' },
  { id: 'jazz', label: 'Jazz' },
  { id: 'electronic', label: 'Électronique' },
  { id: 'soul', label: 'Soul / Funk' },
  { id: 'hiphop', label: 'Hip-Hop' },
  { id: 'classical', label: 'Classique' },
]

const vinyls = [
  { title: 'The Dark Side of the Moon', artist: 'Pink Floyd', year: '1973', label: 'Harvest', country: '🇯🇵', condition: 'NM', price: '€285', genre: 'rock', color: '#1a1a2e' },
  { title: 'Kind of Blue', artist: 'Miles Davis', year: '1959', label: 'Columbia', country: '🇺🇸', condition: 'VG+', price: '€420', genre: 'jazz', color: '#0f3460' },
  { title: 'Discovery', artist: 'Daft Punk', year: '2001', label: 'Virgin', country: '🇫🇷', condition: 'NM', price: '€95', genre: 'electronic', color: '#e94560' },
  { title: 'OK Computer', artist: 'Radiohead', year: '1997', label: 'Parlophone', country: '🇬🇧', condition: 'NM', price: '€145', genre: 'rock', color: '#533483' },
  { title: 'Rumours', artist: 'Fleetwood Mac', year: '1977', label: 'Warner Bros', country: '🇩🇪', condition: 'VG+', price: '€68', genre: 'rock', color: '#4a3728' },
  { title: 'What\'s Going On', artist: 'Marvin Gaye', year: '1971', label: 'Tamla', country: '🇺🇸', condition: 'VG', price: '€180', genre: 'soul', color: '#2d6a4f' },
  { title: 'Homework', artist: 'Daft Punk', year: '1997', label: 'Virgin', country: '🇫🇷', condition: 'NM', price: '€110', genre: 'electronic', color: '#d4a373' },
  { title: 'Head Hunters', artist: 'Herbie Hancock', year: '1973', label: 'Columbia', country: '🇺🇸', condition: 'VG+', price: '€55', genre: 'jazz', color: '#bc6c25' },
  { title: 'Illmatic', artist: 'Nas', year: '1994', label: 'Columbia', country: '🇺🇸', condition: 'NM', price: '€75', genre: 'hiphop', color: '#6b705c' },
  { title: 'Loveless', artist: 'My Bloody Valentine', year: '1991', label: 'Creation', country: '🇬🇧', condition: 'VG+', price: '€320', genre: 'rock', color: '#c9184a' },
]

const filteredVinyls = computed(() => {
  let results = vinyls
  if (activeFilter.value !== 'all') {
    results = results.filter(v => v.genre === activeFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    results = results.filter(v =>
      v.title.toLowerCase().includes(q)
      || v.artist.toLowerCase().includes(q)
      || v.label.toLowerCase().includes(q),
    )
  }
  return results
})

const trendingArtists = [
  { name: 'Pink Floyd', count: '2.4k' },
  { name: 'Daft Punk', count: '1.8k' },
  { name: 'Miles Davis', count: '3.1k' },
  { name: 'Radiohead', count: '1.2k' },
  { name: 'Marvin Gaye', count: '890' },
]
</script>

<template>
  <div class="min-h-screen">
    <!-- ─── NAV (noir) ─── -->
    <nav class="sticky inset-x-0 top-0 z-50 bg-g-black">
      <div class="mx-auto flex h-24 max-w-[1400px] items-center justify-between px-6">
        <NuxtLink to="/" class="shrink-0 cursor-pointer">
          <img :src="logoBlanc" alt="GROOV" class="h-9">
        </NuxtLink>

        <!-- Search -->
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
        </div>
      </div>
    </nav>

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
              class="cursor-pointer rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-all"
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
    <div class="sticky top-24 z-40 border-b border-g-100 bg-g-50/95 backdrop-blur-sm">
      <div class="mx-auto max-w-[1400px] overflow-x-auto px-6">
        <div class="flex items-center gap-1.5 py-3">
          <button
            v-for="f in filters"
            :key="f.id"
            class="shrink-0 cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-all"
            :class="activeFilter === f.id
              ? 'bg-g-black text-g-white'
              : 'text-g-500 hover:bg-g-50 hover:text-g-black'"
            @click="activeFilter = f.id"
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
      <div
        v-if="filteredVinyls.length"
        class="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      >
        <div
          v-for="vinyl in filteredVinyls"
          :key="vinyl.title + vinyl.country"
          class="group cursor-pointer"
        >
          <!-- Cover placeholder -->
          <div class="relative aspect-square overflow-hidden rounded-lg" :style="{ backgroundColor: vinyl.color }">
            <!-- Initiales de l'artiste comme placeholder visuel -->
            <div class="flex h-full w-full items-center justify-center">
              <span class="text-4xl font-black text-white/20 sm:text-5xl">
                {{ vinyl.artist.split(' ').map(w => w[0]).join('') }}
              </span>
            </div>

            <!-- Hover overlay -->
            <div class="absolute inset-0 flex items-end bg-gradient-to-t from-g-black/80 via-g-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <div class="flex w-full items-end justify-between p-3">
                <span class="rounded-lg bg-g-white px-2.5 py-1 text-xs font-bold text-g-black">
                  {{ vinyl.price }}
                </span>
                <span class="rounded-lg bg-g-white/20 px-2 py-1 text-[11px] font-medium text-g-white backdrop-blur-sm">
                  Voir →
                </span>
              </div>
            </div>

            <!-- Condition -->
            <div class="absolute right-2.5 top-2.5">
              <span class="rounded-lg bg-g-black/50 px-2 py-0.5 font-[family-name:var(--font-mono)] text-[11px] font-medium text-g-white backdrop-blur-sm">
                {{ vinyl.condition }}
              </span>
            </div>
          </div>

          <!-- Info -->
          <div class="mt-3">
            <p class="truncate text-sm font-semibold text-g-950">{{ vinyl.title }}</p>
            <p class="mt-0.5 truncate text-xs text-g-500">{{ vinyl.artist }}</p>
            <div class="mt-2 flex items-center justify-between">
              <span class="text-sm font-bold text-g-950">{{ vinyl.price }}</span>
              <span class="text-[11px] text-g-400">{{ vinyl.label }} · {{ vinyl.year }}</span>
            </div>
          </div>
        </div>
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

      <!-- Load more -->
      <div v-if="filteredVinyls.length" class="mt-14 text-center">
        <UButton
          size="md"
          class="cursor-pointer rounded-lg bg-g-black px-8 text-sm font-medium text-g-white hover:bg-g-700"
          @click="openRegister"
        >
          S'inscrire pour voir plus
        </UButton>
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

    <!-- ─── FOOTER ─── -->
    <footer class="border-t border-g-100 px-6 py-8">
      <div class="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 sm:flex-row">
        <img :src="logoNoir" alt="GROOV" class="h-5 opacity-30">
        <div class="flex gap-6">
          <NuxtLink to="#" class="cursor-pointer text-xs text-g-400 transition-colors hover:text-g-950">
            À propos
          </NuxtLink>
          <NuxtLink to="#" class="cursor-pointer text-xs text-g-400 transition-colors hover:text-g-950">
            Contact
          </NuxtLink>
          <NuxtLink to="#" class="cursor-pointer text-xs text-g-400 transition-colors hover:text-g-950">
            CGU
          </NuxtLink>
        </div>
        <p class="text-[11px] text-g-400">
          Discogs API · Supabase · Vercel · © 2026
        </p>
      </div>
    </footer>
  </div>
</template>
