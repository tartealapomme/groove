<script lang="ts" setup>
import logoBlanc from '~/assets/img/groov_logo_blanc.svg'
import logoNoir from '~/assets/img/groov_logo_noir.svg'

const { openLogin, openRegister } = useAuthModal()
const route = useRoute()

interface Vinyl {
  id: string
  title: string
  artist: string
  year: string
  label: string
  genre: string
  color: string
  catNo: string
  format: string
  country: string
  tracklist: { side: string, title: string, duration: string }[]
}

interface Seller {
  name: string
  rating: string
  country: string
  flag: string
  condition: string
  sleeveCondition: string
  price: string
  shipping: string
}

interface Recommendation {
  id: string
  title: string
  artist: string
  year: string
  price: string
  color: string
}

const vinylsDb: Record<string, Vinyl> = {
  'dark-side-of-the-moon': {
    id: 'dark-side-of-the-moon',
    title: 'The Dark Side of the Moon',
    artist: 'Pink Floyd',
    year: '1973',
    label: 'Harvest',
    genre: 'Rock progressif',
    color: '#1a1a2e',
    catNo: 'SHVL 804',
    format: 'LP, Album, Gatefold',
    country: 'UK',
    tracklist: [
      { side: 'A', title: 'Speak to Me', duration: '1:30' },
      { side: 'A', title: 'Breathe', duration: '2:43' },
      { side: 'A', title: 'On the Run', duration: '3:36' },
      { side: 'A', title: 'Time', duration: '6:53' },
      { side: 'A', title: 'The Great Gig in the Sky', duration: '4:36' },
      { side: 'B', title: 'Money', duration: '6:22' },
      { side: 'B', title: 'Us and Them', duration: '7:49' },
      { side: 'B', title: 'Any Colour You Like', duration: '3:25' },
      { side: 'B', title: 'Brain Damage', duration: '3:50' },
      { side: 'B', title: 'Eclipse', duration: '2:03' },
    ],
  },
  'kind-of-blue': {
    id: 'kind-of-blue',
    title: 'Kind of Blue',
    artist: 'Miles Davis',
    year: '1959',
    label: 'Columbia',
    genre: 'Jazz modal',
    color: '#0f3460',
    catNo: 'CL 1355',
    format: 'LP, Album, Mono',
    country: 'US',
    tracklist: [
      { side: 'A', title: 'So What', duration: '9:22' },
      { side: 'A', title: 'Freddie Freeloader', duration: '9:46' },
      { side: 'A', title: 'Blue in Green', duration: '5:37' },
      { side: 'B', title: 'All Blues', duration: '11:33' },
      { side: 'B', title: 'Flamenco Sketches', duration: '9:26' },
    ],
  },
  discovery: {
    id: 'discovery',
    title: 'Discovery',
    artist: 'Daft Punk',
    year: '2001',
    label: 'Virgin',
    genre: 'French house, Electro',
    color: '#e94560',
    catNo: '7243 8 10059 1 8',
    format: '2xLP, Album, Gatefold',
    country: 'France',
    tracklist: [
      { side: 'A', title: 'One More Time', duration: '5:20' },
      { side: 'A', title: 'Aerodynamic', duration: '3:32' },
      { side: 'A', title: 'Digital Love', duration: '4:58' },
      { side: 'B', title: 'Harder, Better, Faster, Stronger', duration: '3:45' },
      { side: 'B', title: 'Crescendolls', duration: '3:31' },
      { side: 'B', title: 'Nightvision', duration: '1:44' },
      { side: 'C', title: 'Superheroes', duration: '3:57' },
      { side: 'C', title: 'High Life', duration: '3:22' },
      { side: 'C', title: 'Something About Us', duration: '3:52' },
      { side: 'D', title: 'Voyager', duration: '3:47' },
      { side: 'D', title: 'Veridis Quo', duration: '5:44' },
      { side: 'D', title: 'Face to Face', duration: '4:00' },
      { side: 'D', title: 'Too Long', duration: '10:00' },
    ],
  },
}

const vinyl = computed<Vinyl | undefined>(() => {
  const id = route.params.id as string
  return vinylsDb[id]
})

const sellers = computed<Seller[]>(() => {
  if (!vinyl.value) return []
  return [
    { name: 'VinylVault_EU', rating: '99.4%', country: 'Allemagne', flag: '🇩🇪', condition: 'NM', sleeveCondition: 'NM', price: '€285', shipping: '€8' },
    { name: 'GrooveCollector', rating: '98.7%', country: 'France', flag: '🇫🇷', condition: 'VG+', sleeveCondition: 'VG+', price: '€210', shipping: '€6' },
    { name: 'WaxTemple', rating: '99.1%', country: 'Pays-Bas', flag: '🇳🇱', condition: 'NM', sleeveCondition: 'VG+', price: '€265', shipping: '€7' },
    { name: 'DiscogsKing_UK', rating: '97.8%', country: 'Royaume-Uni', flag: '🇬🇧', condition: 'VG+', sleeveCondition: 'VG', price: '€195', shipping: '€12' },
    { name: 'TokyoWax', rating: '99.8%', country: 'Japon', flag: '🇯🇵', condition: 'NM', sleeveCondition: 'NM', price: '€340', shipping: '€18' },
    { name: 'MilanRecords', rating: '98.2%', country: 'Italie', flag: '🇮🇹', condition: 'VG', sleeveCondition: 'VG', price: '€145', shipping: '€9' },
  ]
})

const recommendations = computed<Recommendation[]>(() => {
  if (!vinyl.value) return []
  const all: Recommendation[] = [
    { id: 'dark-side-of-the-moon', title: 'The Dark Side of the Moon', artist: 'Pink Floyd', year: '1973', price: '€285', color: '#1a1a2e' },
    { id: 'kind-of-blue', title: 'Kind of Blue', artist: 'Miles Davis', year: '1959', price: '€420', color: '#0f3460' },
    { id: 'discovery', title: 'Discovery', artist: 'Daft Punk', year: '2001', price: '€95', color: '#e94560' },
    { id: 'ok-computer', title: 'OK Computer', artist: 'Radiohead', year: '1997', price: '€145', color: '#533483' },
    { id: 'rumours', title: 'Rumours', artist: 'Fleetwood Mac', year: '1977', price: '€68', color: '#4a3728' },
    { id: 'whats-going-on', title: "What's Going On", artist: 'Marvin Gaye', year: '1971', price: '€180', color: '#2d6a4f' },
    { id: 'homework', title: 'Homework', artist: 'Daft Punk', year: '1997', price: '€110', color: '#d4a373' },
    { id: 'head-hunters', title: 'Head Hunters', artist: 'Herbie Hancock', year: '1973', price: '€55', color: '#bc6c25' },
  ]
  return all.filter(r => r.id !== vinyl.value?.id).slice(0, 5)
})

const activeSide = ref('all')
const filteredTracklist = computed(() => {
  if (!vinyl.value) return []
  if (activeSide.value === 'all') return vinyl.value.tracklist
  return vinyl.value.tracklist.filter(t => t.side === activeSide.value)
})

const sides = computed(() => {
  if (!vinyl.value) return []
  const unique = [...new Set(vinyl.value.tracklist.map(t => t.side))]
  return ['all', ...unique]
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

        <!-- Search -->
        <div class="mx-8 hidden max-w-xl flex-1 md:block">
          <div class="flex items-center rounded-lg border border-g-500 bg-g-700 px-4 py-2.5 transition-colors focus-within:border-g-400 focus-within:bg-g-600">
            <UIcon name="i-lucide-search" class="mr-2.5 h-[18px] w-[18px] shrink-0 text-g-400" />
            <input
              type="text"
              placeholder="Artiste, album, label, pressage…"
              class="w-full bg-transparent text-[15px] text-g-white outline-none placeholder:text-g-400"
              @keydown.enter="navigateTo('/')"
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

    <!-- ─── 404 ─── -->
    <div v-if="!vinyl" class="py-32 text-center">
      <UIcon name="i-lucide-disc-3" class="mx-auto mb-4 h-12 w-12 text-g-200" />
      <p class="text-lg font-medium text-g-950">Vinyle introuvable.</p>
      <NuxtLink to="/" class="mt-3 inline-block cursor-pointer text-sm text-g-400 underline underline-offset-4 hover:text-g-950">
        Retour à l'accueil
      </NuxtLink>
    </div>

    <template v-else>
      <!-- ─── BREADCRUMB ─── -->
      <div class="border-b border-g-100 px-6 py-3">
        <div class="mx-auto flex max-w-[1400px] items-center gap-2 text-xs text-g-400">
          <NuxtLink to="/" class="cursor-pointer transition-colors hover:text-g-950">Accueil</NuxtLink>
          <span>/</span>
          <span class="text-g-950">{{ vinyl.artist }} — {{ vinyl.title }}</span>
        </div>
      </div>

      <!-- ─── MAIN DETAILS ─── -->
      <section class="px-6 py-10">
        <div class="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[400px_1fr]">
          <!-- Cover (sticky) -->
          <div class="self-start lg:sticky lg:top-28">
            <div class="aspect-square overflow-hidden rounded-lg" :style="{ backgroundColor: vinyl.color }">
              <div class="flex h-full w-full items-center justify-center">
                <span class="text-7xl font-black text-white/20">
                  {{ vinyl.artist.split(' ').map(w => w[0]).join('') }}
                </span>
              </div>
            </div>
          </div>

          <!-- Infos -->
          <div>
            <p class="text-xs font-medium uppercase tracking-[0.2em] text-g-400">{{ vinyl.genre }}</p>
            <h1 class="mt-2 text-3xl font-bold tracking-tight text-g-950 sm:text-4xl">{{ vinyl.title }}</h1>
            <p class="mt-1 text-lg text-g-500">{{ vinyl.artist }}</p>

            <div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div class="rounded-lg border border-g-100 bg-g-white p-3">
                <p class="text-[11px] font-medium uppercase tracking-wider text-g-400">Année</p>
                <p class="mt-0.5 text-sm font-semibold text-g-950">{{ vinyl.year }}</p>
              </div>
              <div class="rounded-lg border border-g-100 bg-g-white p-3">
                <p class="text-[11px] font-medium uppercase tracking-wider text-g-400">Label</p>
                <p class="mt-0.5 text-sm font-semibold text-g-950">{{ vinyl.label }}</p>
              </div>
              <div class="rounded-lg border border-g-100 bg-g-white p-3">
                <p class="text-[11px] font-medium uppercase tracking-wider text-g-400">Cat. No.</p>
                <p class="mt-0.5 font-[family-name:var(--font-mono)] text-sm font-semibold text-g-950">{{ vinyl.catNo }}</p>
              </div>
              <div class="rounded-lg border border-g-100 bg-g-white p-3">
                <p class="text-[11px] font-medium uppercase tracking-wider text-g-400">Format</p>
                <p class="mt-0.5 text-sm font-semibold text-g-950">{{ vinyl.format }}</p>
              </div>
            </div>

            <!-- Prix range -->
            <div class="mt-6 rounded-lg border border-g-100 bg-g-white p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs text-g-400">À partir de</p>
                  <p class="text-2xl font-bold text-g-950">{{ sellers[sellers.length - 1]?.price }}</p>
                </div>
                <div class="flex items-center gap-4">
                  <div class="text-right">
                    <p class="text-xs text-g-400">{{ sellers.length }} vendeurs</p>
                    <p class="text-xs text-g-400">{{ sellers.filter(s => ['France', 'Allemagne', 'Pays-Bas', 'Italie'].includes(s.country)).length }} en Europe</p>
                  </div>
                  <button
                    class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-g-100 bg-g-50 text-g-400 transition-all hover:border-g-950 hover:bg-g-950 hover:text-g-white"
                    title="Créer une alerte"
                    @click="openRegister"
                  >
                    <UIcon name="i-lucide-bell" class="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Tracklist -->
            <div class="mt-6">
              <div class="flex items-center justify-between">
                <h2 class="text-sm font-semibold text-g-950">Tracklist</h2>
                <div class="flex gap-1">
                  <button
                    v-for="s in sides"
                    :key="s"
                    class="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition-all"
                    :class="activeSide === s
                      ? 'bg-g-black text-g-white'
                      : 'text-g-400 hover:text-g-950'"
                    @click="activeSide = s"
                  >
                    {{ s === 'all' ? 'Tout' : `Face ${s}` }}
                  </button>
                </div>
              </div>

              <div class="mt-3 overflow-hidden rounded-lg border border-g-100">
                <div
                  v-for="(track, i) in filteredTracklist"
                  :key="track.title"
                  class="flex items-center justify-between border-b border-g-100 px-4 py-2.5 last:border-0"
                  :class="i % 2 === 0 ? 'bg-g-white' : 'bg-g-50'"
                >
                  <div class="flex items-center gap-3">
                    <span class="w-6 font-[family-name:var(--font-mono)] text-xs text-g-300">{{ track.side }}{{ i + 1 }}</span>
                    <span class="text-sm text-g-950">{{ track.title }}</span>
                  </div>
                  <span class="font-[family-name:var(--font-mono)] text-xs text-g-400">{{ track.duration }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── SELLERS ─── -->
      <section class="border-t border-g-100 px-6 py-10">
        <div class="mx-auto max-w-[1400px]">
          <div class="flex items-end justify-between">
            <div>
              <p class="text-xs font-medium uppercase tracking-[0.2em] text-g-400">Marketplace</p>
              <h2 class="mt-1 text-2xl font-bold tracking-tight text-g-950">Vendeurs disponibles</h2>
            </div>
            <p class="text-xs text-g-400">Trié par prix</p>
          </div>

          <div class="mt-6 overflow-hidden rounded-lg border border-g-100">
            <!-- Table header -->
            <div class="hidden grid-cols-[1fr_80px_80px_100px_80px_100px] gap-4 border-b border-g-100 bg-g-50 px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-g-400 sm:grid">
              <span>Vendeur</span>
              <span>Média</span>
              <span>Pochette</span>
              <span>Pays</span>
              <span>Livraison</span>
              <span class="text-right">Prix</span>
            </div>

            <!-- Rows -->
            <div
              v-for="(seller, i) in sellers"
              :key="seller.name"
              class="cursor-pointer border-b border-g-100 transition-colors last:border-0 hover:bg-g-50"
            >
              <!-- Desktop -->
              <div class="hidden grid-cols-[1fr_80px_80px_100px_80px_100px] items-center gap-4 px-5 py-4 sm:grid">
                <div>
                  <p class="text-sm font-medium text-g-950">{{ seller.name }}</p>
                  <p class="text-xs text-g-400">{{ seller.rating }} positif</p>
                </div>
                <span class="rounded-lg bg-g-50 px-2 py-0.5 text-center font-[family-name:var(--font-mono)] text-xs text-g-600">{{ seller.condition }}</span>
                <span class="rounded-lg bg-g-50 px-2 py-0.5 text-center font-[family-name:var(--font-mono)] text-xs text-g-600">{{ seller.sleeveCondition }}</span>
                <span class="text-sm text-g-500">{{ seller.flag }} {{ seller.country }}</span>
                <span class="text-xs text-g-400">+ {{ seller.shipping }}</span>
                <span class="text-right text-base font-bold text-g-950">{{ seller.price }}</span>
              </div>

              <!-- Mobile -->
              <div class="flex items-center justify-between px-4 py-3 sm:hidden">
                <div>
                  <p class="text-sm font-medium text-g-950">{{ seller.name }}</p>
                  <p class="text-xs text-g-400">{{ seller.flag }} {{ seller.country }} · {{ seller.condition }}/{{ seller.sleeveCondition }} · + {{ seller.shipping }}</p>
                </div>
                <span class="text-base font-bold text-g-950">{{ seller.price }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── RECOMMENDATIONS ─── -->
      <section class="border-t border-g-100 px-6 py-10">
        <div class="mx-auto max-w-[1400px]">
          <p class="text-xs font-medium uppercase tracking-[0.2em] text-g-400">Vous aimerez aussi</p>
          <h2 class="mt-1 text-2xl font-bold tracking-tight text-g-950">Recommandations</h2>

          <div class="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            <NuxtLink
              v-for="rec in recommendations"
              :key="rec.id"
              :to="`/vinyl/${rec.id}`"
              class="group cursor-pointer"
            >
              <div class="relative aspect-square overflow-hidden rounded-lg" :style="{ backgroundColor: rec.color }">
                <div class="flex h-full w-full items-center justify-center">
                  <span class="text-4xl font-black text-white/20 sm:text-5xl">
                    {{ rec.artist.split(' ').map(w => w[0]).join('') }}
                  </span>
                </div>
                <div class="absolute inset-0 flex items-end bg-gradient-to-t from-g-black/80 via-g-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <div class="flex w-full items-end justify-between p-3">
                    <span class="rounded-lg bg-g-white px-2.5 py-1 text-xs font-bold text-g-black">
                      {{ rec.price }}
                    </span>
                    <span class="rounded-lg bg-g-white/20 px-2 py-1 text-[11px] font-medium text-g-white backdrop-blur-sm">
                      Voir →
                    </span>
                  </div>
                </div>
              </div>
              <div class="mt-3">
                <p class="truncate text-sm font-semibold text-g-950">{{ rec.title }}</p>
                <p class="mt-0.5 truncate text-xs text-g-500">{{ rec.artist }}</p>
                <div class="mt-2 flex items-center justify-between">
                  <span class="text-sm font-bold text-g-950">{{ rec.price }}</span>
                  <span class="text-[11px] text-g-400">{{ rec.year }}</span>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </section>
    </template>

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
