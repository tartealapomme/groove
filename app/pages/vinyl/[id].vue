<script lang="ts" setup>
const { openRegister } = useAuthModal()
const { getRelease, searchReleases, getPriceSuggestions } = useDiscogs()
const route = useRoute()
const releaseId = route.params.id as string

const { data: vinyl, error } = await useAsyncData(
  `release-${releaseId}`,
  () => getRelease(releaseId),
)

const artistName = computed(() => vinyl.value?.artists?.map(a => a.name).join(', ') || '')
const mainGenre = computed(() => vinyl.value?.genres?.[0] || '')
const coverUrl = computed(() => vinyl.value?.images?.[0]?.uri || '')
const coverThumb = computed(() => vinyl.value?.images?.[0]?.uri150 || '')
const labelInfo = computed(() => vinyl.value?.labels?.[0])
const formatInfo = computed(() => {
  if (!vinyl.value?.formats?.[0]) return ''
  const f = vinyl.value.formats[0]
  return [f.name, ...(f.descriptions || [])].join(', ')
})

const activeSide = ref('all')
const tracklist = computed(() => vinyl.value?.tracklist?.filter(t => t.type_ === 'track') || [])
const filteredTracklist = computed(() => {
  if (activeSide.value === 'all') return tracklist.value
  return tracklist.value.filter(t => t.position.startsWith(activeSide.value))
})

const sides = computed(() => {
  const positions = tracklist.value.map(t => t.position.replace(/\d+/g, '')).filter(Boolean)
  const unique = [...new Set(positions)]
  return unique.length > 1 ? ['all', ...unique] : ['all']
})

const conditionOrder = ['Mint (M)', 'Near Mint (NM or M-)', 'Very Good Plus (VG+)', 'Very Good (VG)', 'Good Plus (G+)', 'Good (G)', 'Fair (F)', 'Poor (P)']
const conditionLabels: Record<string, string> = {
  'Mint (M)': 'Mint',
  'Near Mint (NM or M-)': 'Near Mint',
  'Very Good Plus (VG+)': 'VG+',
  'Very Good (VG)': 'VG',
  'Good Plus (G+)': 'G+',
  'Good (G)': 'G',
  'Fair (F)': 'Fair',
  'Poor (P)': 'Poor',
}

const { data: priceSuggestions } = await useAsyncData(
  `prices-${releaseId}`,
  () => getPriceSuggestions(releaseId).catch(() => null),
  { lazy: true },
)

const sortedPrices = computed(() => {
  if (!priceSuggestions.value) return []
  return conditionOrder
    .filter(c => priceSuggestions.value![c])
    .map(c => ({
      condition: c,
      label: conditionLabels[c] || c,
      price: priceSuggestions.value![c].value,
      currency: priceSuggestions.value![c].currency,
    }))
})

const { data: recommendations } = await useAsyncData(
  `recs-${releaseId}`,
  async () => {
    if (!mainGenre.value) return []
    const res = await searchReleases({ genre: mainGenre.value, per_page: 6, sort: 'want', sort_order: 'desc' })
    return res.results
      .filter(r => String(r.id) !== releaseId)
      .slice(0, 5)
      .map(r => ({
        id: r.id,
        title: r.title.includes(' - ') ? r.title.split(' - ').slice(1).join(' - ') : r.title,
        artist: r.title.includes(' - ') ? r.title.split(' - ')[0] : '',
        year: r.year || '',
        thumb: r.thumb,
        cover: r.cover_image,
        community: r.community,
      }))
  },
  { lazy: true, watch: [vinyl] },
)
</script>

<template>
  <div class="min-h-screen overflow-x-hidden pb-[env(safe-area-inset-bottom,0px)]">
    <AppHeader />

    <SubNav />

    <!-- ─── LOADING ─── -->
    <div v-if="!vinyl && !error" class="flex items-center justify-center py-24 sm:py-32">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-g-400" />
    </div>

    <!-- ─── 404 ─── -->
    <div v-else-if="error || !vinyl" class="py-24 text-center sm:py-32">
      <UIcon name="i-lucide-disc-3" class="mx-auto mb-4 h-10 w-10 text-g-200 sm:h-12 sm:w-12" />
      <p class="text-base font-medium text-g-950 sm:text-lg">Vinyle introuvable.</p>
      <NuxtLink to="/" class="mt-4 inline-block cursor-pointer py-3 text-sm text-g-400 underline underline-offset-4 hover:text-g-950 sm:mt-3 sm:py-0">
        Retour à l'accueil
      </NuxtLink>
    </div>

    <template v-else>
      <!-- ─── BREADCRUMB ─── -->
      <div class="border-b border-g-100 px-4 py-3 sm:px-6">
        <div class="mx-auto flex max-w-[1400px] items-center gap-2 overflow-x-auto scrollbar-none text-xs text-g-400">
          <NuxtLink to="/" class="shrink-0 cursor-pointer transition-colors hover:text-g-950">Accueil</NuxtLink>
          <span class="shrink-0">/</span>
          <NuxtLink to="/explore" class="shrink-0 cursor-pointer transition-colors hover:text-g-950">Explorer</NuxtLink>
          <span class="shrink-0">/</span>
          <span class="min-w-0 truncate text-g-950">{{ artistName }} — {{ vinyl.title }}</span>
        </div>
      </div>

      <!-- ─── MAIN DETAILS ─── -->
      <section class="px-4 py-6 sm:px-6 sm:py-10">
        <div class="mx-auto grid max-w-[1400px] gap-6 lg:grid-cols-[400px_1fr] lg:gap-10">
          <!-- Cover (sticky) -->
          <div class="self-start lg:sticky lg:top-[8.5rem]">
            <div class="aspect-square overflow-hidden rounded-lg bg-g-100">
              <img
                v-if="coverUrl"
                :src="coverUrl"
                :alt="vinyl.title"
                class="h-full w-full object-cover"
              >
              <div v-else class="flex h-full w-full items-center justify-center bg-g-200">
                <span class="text-4xl font-black text-g-400/20 sm:text-5xl lg:text-7xl">
                  {{ artistName.split(' ').map((w: string) => w[0]).join('').substring(0, 2) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Infos -->
          <div class="min-w-0">
            <p class="truncate text-sm font-medium uppercase tracking-[0.2em] text-g-400 sm:text-xs">
              {{ vinyl.genres?.join(', ') }} {{ vinyl.styles?.length ? `· ${vinyl.styles.join(', ')}` : '' }}
            </p>
            <h1 class="mt-2 text-2xl font-bold tracking-tight text-g-950 sm:text-3xl sm:text-4xl">{{ vinyl.title }}</h1>
            <p class="mt-1 truncate text-base text-g-500 sm:text-lg">{{ artistName }}</p>

            <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                class="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-g-black px-5 py-2.5 text-sm font-medium text-g-white transition-colors hover:bg-g-700"
                @click="openRegister"
              >
                <UIcon name="i-lucide-plus" class="h-4 w-4 shrink-0" />
                Ajouter à ma collection
              </button>
              <button
                class="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-g-200 px-4 py-2.5 text-sm text-g-500 transition-colors hover:border-g-400 hover:text-g-950"
                @click="openRegister"
              >
                <UIcon name="i-lucide-heart" class="h-4 w-4 shrink-0" />
                Wishlist
              </button>
            </div>

            <div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <div class="min-w-0 rounded-lg border border-g-100 bg-g-white p-3">
                <p class="text-[11px] font-medium uppercase tracking-wider text-g-400">Année</p>
                <p class="mt-0.5 text-sm font-semibold text-g-950">{{ vinyl.year || '—' }}</p>
              </div>
              <div class="min-w-0 rounded-lg border border-g-100 bg-g-white p-3">
                <p class="text-[11px] font-medium uppercase tracking-wider text-g-400">Label</p>
                <p class="mt-0.5 text-sm font-semibold text-g-950">{{ labelInfo?.name || '—' }}</p>
              </div>
              <div class="min-w-0 rounded-lg border border-g-100 bg-g-white p-3">
                <p class="text-[11px] font-medium uppercase tracking-wider text-g-400">Cat. No.</p>
                <p class="mt-0.5 font-[family-name:var(--font-mono)] text-sm font-semibold text-g-950">{{ labelInfo?.catno || '—' }}</p>
              </div>
              <div class="min-w-0 rounded-lg border border-g-100 bg-g-white p-3">
                <p class="text-[11px] font-medium uppercase tracking-wider text-g-400">Format</p>
                <p class="mt-0.5 text-sm font-semibold text-g-950">{{ formatInfo || '—' }}</p>
              </div>
            </div>

            <!-- Country + Community -->
            <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <div class="min-w-0 rounded-lg border border-g-100 bg-g-white p-3">
                <p class="text-[11px] font-medium uppercase tracking-wider text-g-400">Pays</p>
                <p class="mt-0.5 text-sm font-semibold text-g-950">{{ vinyl.country || '—' }}</p>
              </div>
              <div class="min-w-0 rounded-lg border border-g-100 bg-g-white p-3">
                <p class="text-[11px] font-medium uppercase tracking-wider text-g-400">Have</p>
                <p class="mt-0.5 text-sm font-semibold text-g-950">{{ vinyl.community?.have?.toLocaleString('fr-FR') || '—' }}</p>
              </div>
              <div class="min-w-0 rounded-lg border border-g-100 bg-g-white p-3">
                <p class="text-[11px] font-medium uppercase tracking-wider text-g-400">Want</p>
                <p class="mt-0.5 text-sm font-semibold text-g-950">{{ vinyl.community?.want?.toLocaleString('fr-FR') || '—' }}</p>
              </div>
              <div class="min-w-0 rounded-lg border border-g-100 bg-g-white p-3">
                <p class="text-[11px] font-medium uppercase tracking-wider text-g-400">Note</p>
                <p class="mt-0.5 text-sm font-semibold text-g-950">{{ vinyl.community?.rating?.average ? `${vinyl.community.rating.average.toFixed(1)}/5` : '—' }}</p>
              </div>
            </div>

            <!-- Marketplace -->
            <div v-if="vinyl.marketplace || sortedPrices.length" class="mt-6 overflow-hidden rounded-lg border border-g-100">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-g-100 px-4 py-3">
                <h2 class="text-sm font-semibold text-g-950">Marketplace</h2>
                <div class="flex items-center gap-2">
                  <span v-if="vinyl.marketplace?.num_for_sale" class="text-xs text-g-400">
                    {{ vinyl.marketplace.num_for_sale }} exemplaire{{ vinyl.marketplace.num_for_sale > 1 ? 's' : '' }} en vente
                  </span>
                  <button
                    class="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg text-g-400 transition-all hover:bg-g-100 hover:text-g-950"
                    title="Créer une alerte"
                    @click="openRegister"
                  >
                    <UIcon name="i-lucide-bell" class="h-4 w-4" />
                  </button>
                </div>
              </div>

              <!-- Prix par état -->
              <div v-if="sortedPrices.length" class="divide-y divide-g-100">
                <div
                  v-for="(item, i) in sortedPrices"
                  :key="item.condition"
                  class="flex min-h-[44px] items-center justify-between gap-3 px-4 py-3"
                  :class="i % 2 === 0 ? 'bg-g-white' : 'bg-g-50'"
                >
                  <div class="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      class="inline-flex h-6 items-center rounded-lg px-2 text-[11px] font-semibold"
                      :class="{
                        'bg-emerald-50 text-emerald-700': item.label === 'Mint' || item.label === 'Near Mint',
                        'bg-sky-50 text-sky-700': item.label === 'VG+' || item.label === 'VG',
                        'bg-amber-50 text-amber-700': item.label === 'G+' || item.label === 'G',
                        'bg-g-100 text-g-500': item.label === 'Fair' || item.label === 'Poor',
                      }"
                    >
                      {{ item.label }}
                    </span>
                    <span class="truncate text-xs text-g-400">{{ item.condition }}</span>
                  </div>
                  <span class="shrink-0 font-[family-name:var(--font-mono)] text-sm font-semibold text-g-950">
                    {{ item.price.toFixed(2) }}€
                  </span>
                </div>
              </div>

              <!-- Prix le plus bas + CTA -->
              <div class="flex flex-col gap-4 border-t border-g-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p class="text-[11px] font-medium uppercase tracking-wider text-g-400">À partir de</p>
                  <p class="text-xl font-bold text-g-950">
                    {{ vinyl.marketplace?.lowest_price ? `${vinyl.marketplace.lowest_price.value.toFixed(2)}€` : '—' }}
                  </p>
                </div>
                <a
                  :href="`https://www.discogs.com/sell/release/${releaseId}?ev=rb`"
                  target="_blank"
                  class="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-g-black px-5 py-2.5 text-sm font-medium text-g-white transition-colors hover:bg-g-950"
                >
                  Acheter sur Discogs
                  <UIcon name="i-lucide-external-link" class="h-3.5 w-3.5 shrink-0" />
                </a>
              </div>
            </div>

            <!-- Notes -->
            <details v-if="vinyl.notes" class="group mt-6 rounded-lg border border-g-100">
              <summary class="flex min-h-[44px] cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-g-950 select-none">
                Description
                <UIcon name="i-lucide-chevron-down" class="h-4 w-4 shrink-0 text-g-400 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div class="border-t border-g-100 px-4 py-3">
                <p class="whitespace-pre-line text-sm leading-relaxed text-g-500">{{ vinyl.notes }}</p>
              </div>
            </details>

            <!-- Tracklist -->
            <div v-if="tracklist.length" class="mt-6">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 class="text-sm font-semibold text-g-950">Tracklist</h2>
                <div v-if="sides.length > 1" class="flex flex-wrap gap-2">
                  <button
                    v-for="s in sides"
                    :key="s"
                    class="min-h-[44px] cursor-pointer rounded-lg px-3 py-2 text-xs font-medium transition-all"
                    :class="activeSide === s
                      ? 'bg-g-black text-g-white'
                      : 'text-g-400 hover:text-g-950'"
                    @click="activeSide = s"
                  >
                    {{ s === 'all' ? 'Tout' : `Face ${s}` }}
                  </button>
                </div>
              </div>

              <div class="mt-3 overflow-x-auto overflow-y-hidden rounded-lg border border-g-100">
                <div
                  v-for="(track, i) in filteredTracklist"
                  :key="`${track.position}-${track.title}`"
                  class="flex min-h-[44px] items-center justify-between gap-3 border-b border-g-100 px-4 py-2.5 last:border-0"
                  :class="i % 2 === 0 ? 'bg-g-white' : 'bg-g-50'"
                >
                  <div class="flex min-w-0 flex-1 items-center gap-3">
                    <span class="w-8 shrink-0 font-[family-name:var(--font-mono)] text-xs text-g-300">{{ track.position }}</span>
                    <span class="truncate text-sm text-g-950">{{ track.title }}</span>
                  </div>
                  <span v-if="track.duration" class="shrink-0 font-[family-name:var(--font-mono)] text-xs text-g-400">{{ track.duration }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── RECOMMENDATIONS ─── -->
      <section v-if="recommendations?.length" class="border-t border-g-100 px-4 py-8 sm:px-6 sm:py-10">
        <div class="mx-auto max-w-[1400px]">
          <p class="text-[11px] font-medium uppercase tracking-[0.2em] text-g-400 sm:text-xs">Vous aimerez aussi</p>
          <h2 class="mt-1 text-xl font-bold tracking-tight text-g-950 sm:text-2xl">Recommandations</h2>

          <div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5">
            <NuxtLink
              v-for="rec in recommendations"
              :key="rec.id"
              :to="`/vinyl/${rec.id}`"
              class="group cursor-pointer"
            >
              <div class="relative aspect-square overflow-hidden rounded-lg bg-g-100">
                <img
                  v-if="rec.cover || rec.thumb"
                  :src="rec.cover || rec.thumb"
                  :alt="rec.title"
                  class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                >
                <div v-else class="flex h-full w-full items-center justify-center bg-g-200">
                  <span class="text-3xl font-black text-g-400/30 sm:text-4xl lg:text-5xl">
                    {{ (rec.artist || '').split(' ').map((w: string) => w[0]).join('') || '?' }}
                  </span>
                </div>
                <div class="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-g-black/80 via-g-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <div class="flex w-full items-end justify-between p-3">
                    <span v-if="rec.community" class="rounded-lg bg-g-black/40 px-2 py-1 text-[11px] font-medium text-g-white">
                      {{ rec.community.want }} wants
                    </span>
                    <span class="rounded-lg bg-g-black/40 px-2 py-1 text-[11px] font-medium text-g-white">
                      Voir →
                    </span>
                  </div>
                </div>
              </div>
              <div class="mt-2 min-w-0 sm:mt-3">
                <p class="truncate text-sm font-semibold text-g-950">{{ rec.title }}</p>
                <p class="mt-0.5 truncate text-xs text-g-500">{{ rec.artist }}</p>
                <span class="mt-1 text-[11px] text-g-400">{{ rec.year }}</span>
              </div>
            </NuxtLink>
          </div>
        </div>
      </section>
    </template>

    <AppFooter />
  </div>
</template>
