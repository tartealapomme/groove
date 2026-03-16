<script lang="ts" setup>
const { openRegister } = useAuthModal()
const { getRelease, searchReleases, getPriceSuggestions } = useDiscogs()
const user = useSupabaseUser()
const { addToCollection, removeFromCollection, isInCollection, fetchCollection } = useUserCollection()
const { addFavorite, removeFavorite, isFavorite, fetchFavorites } = useUserFavorites()

const { getReviewsForVinyl, getUserReview, submitReview, deleteReview, getAverageRating } = useVinylReviews()
const toast = useToast()

const justToggledCollection = ref(false)
const justToggledFavorite = ref(false)

watch(user, async (u) => {
  if (u) {
    await fetchCollection()
    await fetchFavorites()
  }
}, { immediate: true })

async function toggleCollection() {
  if (!vinyl.value) return

  const wasIn = isInCollection(vinyl.value.id)
  const { error } = wasIn
    ? await removeFromCollection(vinyl.value.id)
    : await addToCollection({
        discogs_id: vinyl.value.id,
        title: vinyl.value.title,
        artist: artistName.value,
        year: String(vinyl.value.year || ''),
        label: labelInfo.value?.name ?? null,
        genre: vinyl.value.genres || [],
        thumb: coverThumb.value,
        cover: coverUrl.value,
      })
  if (error) {
    if (error.message?.toLowerCase().includes('non connecté') || error.message?.toLowerCase().includes('utilisateur non connecté')) {
      openRegister()
    }
    toast.add({ title: 'Erreur', description: error.message, color: 'error' })
    return
  }
  toast.add({ title: wasIn ? 'Retiré de la collection' : 'Ajouté à la collection', color: 'success' })
  await fetchCollection()
  justToggledCollection.value = false
  requestAnimationFrame(() => {
    justToggledCollection.value = true
    setTimeout(() => { justToggledCollection.value = false }, 250)
  })
}

async function toggleFavorite() {
  if (!vinyl.value) return

  const wasIn = isFavorite(vinyl.value.id)
  const { error } = wasIn
    ? await removeFavorite(vinyl.value.id)
    : await addFavorite({
        discogs_id: vinyl.value.id,
        title: vinyl.value.title,
        artist: artistName.value,
        thumb: coverThumb.value,
        cover: coverUrl.value,
      })
  if (error) {
    if (error.message?.toLowerCase().includes('non connecté') || error.message?.toLowerCase().includes('utilisateur non connecté')) {
      openRegister()
    }
    toast.add({ title: 'Erreur', description: error.message, color: 'error' })
    return
  }
  toast.add({ title: wasIn ? 'Retiré des favoris' : 'Ajouté aux favoris', color: 'success' })
  await fetchFavorites()
  justToggledFavorite.value = false
  requestAnimationFrame(() => {
    justToggledFavorite.value = true
    setTimeout(() => { justToggledFavorite.value = false }, 250)
  })
}

const route = useRoute()
const releaseId = route.params.id as string

const { data: vinyl, error } = await useAsyncData(
  `release-${releaseId}`,
  () => getRelease(releaseId),
  { lazy: true },
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

useSeoMeta({
  title: () => vinyl.value ? `${vinyl.value.title} — ${artistName.value} | GROOV` : 'Chargement… | GROOV',
  description: () => vinyl.value ? `${artistName.value} — ${vinyl.value.title} (${vinyl.value.year}). ${vinyl.value.genres?.join(', ')}. Prix et détails sur GROOV.` : '',
  ogTitle: () => vinyl.value ? `${vinyl.value.title} — ${artistName.value}` : 'GROOV',
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

// ── Reviews ──
interface ReviewDisplay {
  id: string
  user_id: string
  discogs_id: number
  rating: number
  title: string | null
  body: string | null
  created_at: string
  updated_at: string
  profiles?: { display_name: string | null, avatar_url: string | null, email: string | null } | null
}
const reviews = ref<ReviewDisplay[]>([])
const myReview = ref<ReviewDisplay | null>(null)
const showReviewForm = ref(false)
const reviewRating = ref(4)
const reviewTitle = ref('')
const reviewBody = ref('')
const isSubmittingReview = ref(false)
const averageRating = computed(() => getAverageRating(reviews.value))

async function loadReviews() {
  const id = Number(releaseId)
  if (!id) return
  reviews.value = await getReviewsForVinyl(id) as ReviewDisplay[]
  if (user.value) {
    myReview.value = await getUserReview(id) as ReviewDisplay | null
    if (myReview.value) {
      reviewRating.value = myReview.value.rating
      reviewTitle.value = myReview.value.title || ''
      reviewBody.value = myReview.value.body || ''
    }
  }
}

async function onSubmitReview() {
  isSubmittingReview.value = true
  const vinylInfo = vinyl.value
    ? {
        title: vinyl.value.title,
        artist: artistName.value,
        thumb: coverThumb.value,
      }
    : undefined
  const { error } = await submitReview(Number(releaseId), reviewRating.value, reviewTitle.value, reviewBody.value, vinylInfo)
  isSubmittingReview.value = false
  if (error) {
    toast.add({ title: 'Erreur', description: error.message || 'Impossible de publier la review.', color: 'error' })
    return
  }
  toast.add({ title: 'Review publiée', color: 'success' })
  showReviewForm.value = false
  await loadReviews()
}

async function onDeleteReview() {
  const { error } = await deleteReview(Number(releaseId))
  if (error) return
  myReview.value = null
  reviewRating.value = 4
  reviewTitle.value = ''
  reviewBody.value = ''
  toast.add({ title: 'Review supprimée', color: 'success' })
  await loadReviews()
}

function getReviewerName(review: (typeof reviews.value)[number]) {
  const p = (review as any).profiles
  return p?.display_name || p?.email?.split('@')[0] || 'Utilisateur'
}

function getReviewerAvatar(review: (typeof reviews.value)[number]) {
  return (review as any).profiles?.avatar_url
}

function formatReviewDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

watch(vinyl, () => { if (vinyl.value) loadReviews() }, { immediate: true })
</script>

<template>
  <div>
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
        <div class="mx-auto grid max-w-[1400px] items-start gap-6 lg:grid-cols-[400px_1fr] lg:gap-10">
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

          <div class="min-w-0">
            <p class="truncate text-sm font-medium uppercase tracking-[0.2em] text-g-400 sm:text-xs">
              {{ vinyl.genres?.join(', ') }} {{ vinyl.styles?.length ? `· ${vinyl.styles.join(', ')}` : '' }}
            </p>
            <h1 class="mt-2 text-2xl font-bold tracking-tight text-g-950 sm:text-3xl sm:text-4xl">{{ vinyl.title }}</h1>
            <p class="mt-1 truncate text-base text-g-500 sm:text-lg">{{ artistName }}</p>

            <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                class="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all"
                :class="[
                  isInCollection(vinyl.id)
                    ? 'border border-g-200 bg-g-50 text-g-700 hover:border-red-400 hover:bg-red-50 hover:text-red-500'
                    : 'bg-g-black text-g-white hover:bg-g-700',
                  justToggledCollection ? 'scale-[1.02]' : 'scale-100',
                ]"
                @click="toggleCollection"
              >
                <UIcon
                  :name="isInCollection(vinyl.id) ? 'i-lucide-check' : 'i-lucide-plus'"
                  class="h-4 w-4 shrink-0 transition-transform"
                  :class="justToggledCollection ? 'scale-125' : 'scale-100'"
                />
                {{ isInCollection(vinyl.id) ? 'Dans ma collection' : 'Ajouter à ma collection' }}
              </button>
              <button
                class="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-all"
                :class="[
                  isFavorite(vinyl.id)
                    ? 'border-red-200 bg-red-50 text-red-600 hover:border-red-400 hover:bg-red-100'
                    : 'border-g-200 text-g-500 hover:border-g-400 hover:text-g-950',
                  justToggledFavorite ? 'scale-[1.02]' : 'scale-100',
                ]"
                @click="toggleFavorite"
              >
                <UIcon
                  name="i-lucide-heart"
                  class="h-4 w-4 shrink-0 transition-transform"
                  :class="[{ 'fill-current': isFavorite(vinyl.id) }, justToggledFavorite ? 'scale-125' : 'scale-100']"
                />
                {{ isFavorite(vinyl.id) ? 'Dans la wishlist' : 'Wishlist' }}
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
                </div>
              </div>
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
                  rel="noopener"
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

      <!-- ─── REVIEWS ─── -->
      <section class="border-t border-g-100 px-4 py-8 sm:px-6 sm:py-10">
        <div class="mx-auto max-w-[1400px]">
          <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="text-[11px] font-medium uppercase tracking-[0.2em] text-g-400 sm:text-xs">Communauté</p>
              <h2 class="mt-1 text-xl font-bold tracking-tight text-g-950 sm:text-2xl">
                Avis
                <span v-if="reviews.length" class="text-g-400">({{ reviews.length }})</span>
              </h2>
              <div v-if="averageRating" class="mt-1 flex items-center gap-2">
                <div class="flex items-center gap-0.5">
                  <UIcon
                    v-for="i in 5"
                    :key="i"
                    name="i-lucide-star"
                    class="h-4 w-4"
                    :class="i <= Math.round(averageRating) ? 'fill-current text-amber-400' : 'text-g-200'"
                  />
                </div>
                <span class="font-[family-name:var(--font-mono)] text-sm font-semibold text-g-950">{{ averageRating.toFixed(1) }}</span>
              </div>
            </div>
            <button
              v-if="user && !showReviewForm"
              class="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg bg-g-black px-5 py-2.5 text-sm font-medium text-g-white transition-colors hover:bg-g-700"
              @click="showReviewForm = true"
            >
              <UIcon :name="myReview ? 'i-lucide-pencil' : 'i-lucide-plus'" class="h-4 w-4" />
              {{ myReview ? 'Modifier ma review' : 'Écrire une review' }}
            </button>
          </div>

          <!-- Review form -->
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 -translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <div v-if="showReviewForm" class="mb-6 overflow-hidden rounded-lg border border-g-200 bg-g-white">
              <div class="border-b border-g-100 px-5 py-4">
                <h3 class="text-sm font-semibold text-g-950">{{ myReview ? 'Modifier' : 'Écrire' }} votre avis</h3>
              </div>
              <div class="space-y-4 px-5 py-5">
                <!-- Rating -->
                <div>
                  <p class="mb-2 text-xs font-medium text-g-500">Note</p>
                  <div class="flex items-center gap-1">
                    <button
                      v-for="i in 5"
                      :key="i"
                      class="cursor-pointer p-0.5 transition-transform hover:scale-110"
                      @click="reviewRating = i"
                    >
                      <UIcon
                        name="i-lucide-star"
                        class="h-7 w-7 transition-colors"
                        :class="i <= reviewRating ? 'fill-current text-amber-400' : 'text-g-200 hover:text-amber-200'"
                      />
                    </button>
                  </div>
                </div>
                <div>
                  <p class="mb-1.5 text-xs font-medium text-g-500">Titre (optionnel)</p>
                  <input
                    v-model="reviewTitle"
                    type="text"
                    placeholder="En quelques mots…"
                    class="w-full rounded-lg border border-g-200 bg-g-50 px-4 py-2.5 text-sm text-g-950 outline-none placeholder:text-g-400 focus:border-g-400"
                  >
                </div>
                <div>
                  <p class="mb-1.5 text-xs font-medium text-g-500">Votre avis</p>
                  <textarea
                    v-model="reviewBody"
                    rows="3"
                    placeholder="Qualité du pressage, son, pochette, édition…"
                    class="w-full resize-none rounded-lg border border-g-200 bg-g-50 px-4 py-2.5 text-sm text-g-950 outline-none placeholder:text-g-400 focus:border-g-400"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <UButton
                    class="cursor-pointer rounded-lg bg-g-black px-5 py-2.5 text-sm font-medium text-g-white hover:bg-g-700 disabled:opacity-50"
                    :loading="isSubmittingReview"
                    :disabled="isSubmittingReview"
                    @click="onSubmitReview"
                  >
                    Publier
                  </UButton>
                  <button
                    class="cursor-pointer rounded-lg px-4 py-2.5 text-sm text-g-500 transition-colors hover:text-g-950"
                    @click="showReviewForm = false"
                  >
                    Annuler
                  </button>
                  <button
                    v-if="myReview"
                    class="ml-auto cursor-pointer rounded-lg px-4 py-2.5 text-sm text-red-400 transition-colors hover:text-red-600"
                    @click="onDeleteReview"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </Transition>

          <!-- Reviews list -->
          <div v-if="reviews.length" class="space-y-4">
            <div
              v-for="review in reviews"
              :key="review.id"
              class="rounded-lg border border-g-100 bg-g-white px-5 py-4"
              :class="{ 'ring-1 ring-g-300': review.user_id === user?.id }"
            >
              <div class="flex items-start gap-3">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-g-100">
                  <img
                    v-if="getReviewerAvatar(review)"
                    :src="getReviewerAvatar(review)"
                    class="h-full w-full object-cover"
                  >
                  <span v-else class="text-xs font-bold text-g-400">
                    {{ getReviewerName(review).substring(0, 2).toUpperCase() }}
                  </span>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-g-950">{{ getReviewerName(review) }}</span>
                    <span v-if="review.user_id === user?.id" class="rounded bg-g-100 px-1.5 py-0.5 text-[10px] font-medium text-g-500">Vous</span>
                    <span class="text-[11px] text-g-400">{{ formatReviewDate(review.created_at) }}</span>
                  </div>
                  <div class="mt-1 flex items-center gap-0.5">
                    <UIcon
                      v-for="i in 5"
                      :key="i"
                      name="i-lucide-star"
                      class="h-3.5 w-3.5"
                      :class="i <= review.rating ? 'fill-current text-amber-400' : 'text-g-200'"
                    />
                  </div>
                  <p v-if="review.title" class="mt-2 text-sm font-medium text-g-950">{{ review.title }}</p>
                  <p v-if="review.body" class="mt-1 text-sm leading-relaxed text-g-500">{{ review.body }}</p>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="!showReviewForm" class="py-8 text-center">
            <UIcon name="i-lucide-message-square" class="mx-auto mb-3 h-8 w-8 text-g-200" />
            <p class="text-sm text-g-500">Aucun avis pour le moment.</p>
            <button
              v-if="user"
              class="mt-3 cursor-pointer text-sm font-medium text-g-950 underline underline-offset-4"
              @click="showReviewForm = true"
            >
              Soyez le premier
            </button>
          </div>
        </div>
      </section>

      <!-- ─── RECOMMENDATIONS ─── -->
      <section v-if="recommendations?.length" class="border-t border-g-100 px-4 py-8 sm:px-6 sm:py-10">
        <div class="mx-auto max-w-[1400px]">
          <p class="text-[11px] font-medium uppercase tracking-[0.2em] text-g-400 sm:text-xs">Vous aimerez aussi</p>
          <h2 class="mt-1 text-xl font-bold tracking-tight text-g-950 sm:text-2xl">Recommandations</h2>
          <div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5">
            <VinylCard
              v-for="rec in recommendations"
              :key="rec.id"
              :id="rec.id"
              :title="rec.title"
              :artist="rec.artist"
              :year="rec.year"
              :thumb="rec.thumb"
              :cover="rec.cover"
              :community="rec.community"
            />
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
