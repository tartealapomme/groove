<script lang="ts" setup>
const { extractColor } = useDominantColor()
const { collection, fetchCollection, removeFromCollection } = useUserCollection()

definePageMeta({ middleware: 'auth' })

useSeoMeta({
  title: 'Ma Collection — GROOV',
  description: 'Gérez votre collection de vinyles. Vitrine 3D, grille, stats et Rewind.',
})

type ViewMode = 'showcase' | 'grid'
const viewMode = ref<ViewMode>('showcase')
const currentIndex = ref(0)
const isTransitioning = ref(false)

// Breakpoint pour ajuster le carousel (mobile < 640px)
const isMobile = ref(false)
let resizeHandler: (() => void) | undefined

interface CollectionItem {
  id: number
  title: string
  artist: string
  year: string
  genre: string
  label: string
  condition: string
  color: string
  thumb: string
  cover: string
  added: string
}

const isCollectionLoading = ref(true)
const extractedColors = ref<Record<number, string>>({})

const collectionItems = computed<CollectionItem[]>(() => {
  const rows = collection.value
  if (!rows.length) return []
  return rows.map((r) => ({
    id: r.discogs_id,
    title: r.title || '',
    artist: r.artist || '',
    year: r.year || '',
    genre: r.genre?.[0] || '',
    label: r.label || '',
    condition: r.condition || 'NM',
    color: extractedColors.value[r.discogs_id] || '#555555',
    thumb: r.thumb || '',
    cover: r.cover || '',
    added: r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
  }))
})

const displayCollection = collectionItems
const selectedVinyl = computed(() => displayCollection.value[currentIndex.value])

const stats = computed(() => {
  const genres = new Set(displayCollection.value.map(v => v.genre).filter(Boolean)).size
  return { total: displayCollection.value.length, genres }
})

// Estimation simple de la valeur de collection (approx. 18€/vinyle)
const estimatedTotal = computed(() => displayCollection.value.length * 18)
const estimatedLabel = computed(() => {
  if (!displayCollection.value.length) return ''
  return ` · ~${Math.round(estimatedTotal.value).toLocaleString('fr-FR')} € estimés`
})

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
}

function getCardStyle(index: number) {
  const offset = index - currentIndex.value
  const absOffset = Math.abs(offset)
  const sign = Math.sign(offset)
  const baseTx = isMobile.value ? 160 : 240
  const stepTx = isMobile.value ? 55 : 75
  const hideTx = isMobile.value ? 600 : 900

  if (absOffset > 5 || displayCollection.value.length === 0) {
    return { opacity: '0', pointerEvents: 'none' as const, transform: `translateX(${sign * hideTx}px)` }
  }

  if (offset === 0) {
    return {
      transform: isMobile.value ? 'translateZ(40px) scale(1)' : 'translateZ(80px) scale(1)',
      opacity: '1',
      zIndex: 20,
      filter: 'brightness(1)',
    }
  }

  const tx = sign * baseTx + sign * (absOffset - 1) * stepTx
  const ry = sign * (isMobile.value ? -36 : -48)
  const tz = -absOffset * (isMobile.value ? 30 : 50)

  return {
    transform: `translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg)`,
    opacity: `${Math.max(0.25, 1 - absOffset * 0.22)}`,
    zIndex: 20 - absOffset,
    filter: `brightness(${Math.max(0.4, 1 - absOffset * 0.18)})`,
  }
}

function navigate(dir: number) {
  if (isTransitioning.value) return
  const next = currentIndex.value + dir
  if (next < 0 || next >= displayCollection.value.length) return
  isTransitioning.value = true
  currentIndex.value = next
  setTimeout(() => (isTransitioning.value = false), 500)
}

function goTo(index: number) {
  if (isTransitioning.value || index === currentIndex.value || displayCollection.value.length === 0) return
  isTransitioning.value = true
  currentIndex.value = index
  setTimeout(() => (isTransitioning.value = false), 500)
}

let wheelCooldown: ReturnType<typeof setTimeout> | null = null
function onWheel(e: WheelEvent) {
  if (wheelCooldown) return
  const dir = e.deltaY > 0 ? 1 : -1
  navigate(dir)
  wheelCooldown = setTimeout(() => (wheelCooldown = null), 350)
}

let touchStartX = 0
function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
}
function onTouchEnd(e: TouchEvent) {
  const diff = e.changedTouches[0].clientX - touchStartX
  if (Math.abs(diff) > 50) navigate(diff < 0 ? 1 : -1)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') navigate(-1)
  else if (e.key === 'ArrowRight') navigate(1)
}

function extractColorsFromResults() {
  const items = displayCollection.value
  if (!items.length) return
  for (const r of items) {
    const src = r.cover || r.thumb
    if (src) {
      extractColor(src).then((hex) => {
        extractedColors.value = { ...extractedColors.value, [r.id]: hex }
      })
    }
  }
}

const showRewind = ref(false)

// Format pour RewindOverlay (DiscogsSearchResult)
const rawResults = computed(() => displayCollection.value.map((v) => ({
  id: v.id,
  type: 'release',
  title: v.artist ? `${v.artist} - ${v.title}` : v.title,
  thumb: v.thumb,
  cover_image: v.cover,
  uri: '',
  country: '',
  year: v.year,
  genre: v.genre ? [v.genre] : [],
  style: [],
  format: [],
  label: v.label ? [v.label] : [],
  catno: '',
  resource_url: '',
  community: { want: 0, have: 0 },
})))

async function handleRemove(discogsId: number) {
  await removeFromCollection(discogsId)
}

onMounted(async () => {
  isCollectionLoading.value = true
  await fetchCollection()
  isCollectionLoading.value = false
  extractColorsFromResults()
  currentIndex.value = Math.min(2, Math.floor(displayCollection.value.length / 2))
  window.addEventListener('keydown', onKeydown)
  resizeHandler = () => {
    isMobile.value = window.innerWidth < 640
  }
  resizeHandler()
  window.addEventListener('resize', resizeHandler)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  if (typeof resizeHandler === 'function') {
    window.removeEventListener('resize', resizeHandler)
  }
})
</script>

<template>
  <div>
    <SubNav />

    <!-- ─── TITLE + STATS ─── -->
    <section class="border-b border-g-100 bg-white px-4 sm:px-6">
      <div class="mx-auto flex max-w-[1400px] flex-col gap-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:py-8">
        <div class="min-w-0">
          <h1 class="text-2xl font-bold tracking-tight text-g-black sm:text-3xl">Ma Collection</h1>
          <p class="mt-1 text-sm text-g-400">
            {{ stats.total }} vinyles · {{ stats.genres }} genres
          </p>
          <p
            v-if="estimatedLabel"
            class="mt-2 inline-flex items-center gap-2 rounded-full border border-g-200 bg-g-50 px-3 py-1.5 text-xs font-medium text-g-900"
          >
            <UIcon name="i-lucide-wallet-cards" class="h-3.5 w-3.5 shrink-0 text-g-700" />
            <span class="truncate tracking-tight">
              Valeur estimée
              <span class="font-semibold">{{ estimatedLabel.replace(' · ', '') }}</span>
            </span>
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2 sm:shrink-0">
          <UButton
            v-if="displayCollection.length"
            class="min-h-[44px] cursor-pointer rounded-lg bg-g-black px-4 py-2.5 text-sm font-medium text-g-white hover:bg-g-700"
            @click="showRewind = true"
          >
            <UIcon name="i-lucide-sparkles" class="mr-1.5 h-4 w-4" />
            Mon Rewind
          </UButton>
          <button
            class="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm transition-all"
            :class="viewMode === 'showcase' ? 'bg-g-black text-g-white' : 'text-g-400 hover:bg-g-100 hover:text-g-950'"
            @click="viewMode = 'showcase'"
          >
            <UIcon name="i-lucide-disc-3" class="h-4 w-4" />
            <span class="hidden sm:inline">Vitrine</span>
          </button>
          <button
            class="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm transition-all"
            :class="viewMode === 'grid' ? 'bg-g-black text-g-white' : 'text-g-400 hover:bg-g-100 hover:text-g-950'"
            @click="viewMode = 'grid'"
          >
            <UIcon name="i-lucide-grid-3x3" class="h-4 w-4" />
            <span class="hidden sm:inline">Grille</span>
          </button>
        </div>
      </div>
    </section>

    <!-- ─── LOADING ─── -->
    <div v-if="isCollectionLoading" class="flex items-center justify-center py-24">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-g-400" />
    </div>

    <!-- ─── EMPTY STATE ─── -->
    <div v-else-if="!displayCollection.length" class="flex flex-col items-center justify-center py-24 text-center">
      <UIcon name="i-lucide-library-big" class="h-16 w-16 text-g-200 sm:h-20 sm:w-20" />
      <p class="mt-4 text-base font-medium text-g-950">Ta collection est vide</p>
      <p class="mt-1 text-sm text-g-500">Ajoute des vinyles depuis la page Explorer ou les fiches vinyle.</p>
      <NuxtLink to="/explore" class="mt-6">
        <UButton
          class="min-h-[44px] cursor-pointer rounded-lg bg-g-black px-5 py-2.5 text-sm font-medium text-g-white hover:bg-g-700"
        >
          Explorer le catalogue
        </UButton>
      </NuxtLink>
    </div>

    <!-- ═══════════════════════════════════════ -->
    <!-- ─── 3D SHOWCASE MODE ─── -->
    <!-- ═══════════════════════════════════════ -->
    <template v-else-if="viewMode === 'showcase'">
      <!-- Carousel -->
      <section
        class="relative overflow-hidden bg-white px-4 sm:px-6"
        @wheel.prevent="onWheel"
        @touchstart="onTouchStart"
        @touchend="onTouchEnd"
      >
        <!-- Ambient glow -->
        <div
          class="pointer-events-none absolute inset-0 opacity-30 transition-colors duration-700"
          :style="{ background: `radial-gradient(ellipse at 50% 60%, ${selectedVinyl?.color ?? '#555555'}44 0%, transparent 70%)` }"
        />

        <div class="relative mx-auto max-w-[1400px]">
          <!-- Carousel container -->
          <div class="carousel-stage relative mx-auto h-[340px] w-full sm:h-[480px]" style="perspective: 1200px">
            <div
              v-for="(vinyl, index) in displayCollection"
              :key="vinyl.id"
              class="carousel-card absolute left-1/2 top-1/2"
              :style="getCardStyle(index)"
              @click="goTo(index)"
            >
              <!-- Vinyl disc -->
              <div class="disc-wrapper" :class="{ 'is-active': index === currentIndex }">
                <div class="disc" :style="{ '--disc-color': vinyl.color } as any" />
              </div>

              <!-- Album cover -->
              <div class="cover relative overflow-hidden rounded-lg shadow-2xl" :style="{ backgroundColor: vinyl.color }">
                <img
                  v-if="vinyl.cover || vinyl.thumb"
                  :src="vinyl.cover || vinyl.thumb"
                  :alt="vinyl.title"
                  class="h-full w-full object-cover"
                >
                <div v-else class="flex h-full w-full items-center justify-center">
                  <span class="select-none text-4xl font-bold text-white/30">
                    {{ getInitials(vinyl.artist) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Navigation arrows (min 44px touch target) -->
          <button
            class="absolute left-1 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-g-100 bg-white text-g-black shadow-sm transition-all hover:bg-g-50 disabled:pointer-events-none disabled:opacity-20 sm:left-4 sm:h-12 sm:w-12"
            :disabled="currentIndex === 0"
            @click="navigate(-1)"
          >
            <UIcon name="i-lucide-chevron-left" class="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <button
            class="absolute right-1 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-g-100 bg-white text-g-black shadow-sm transition-all hover:bg-g-50 disabled:pointer-events-none disabled:opacity-20 sm:right-4 sm:h-12 sm:w-12"
            :disabled="currentIndex === displayCollection.length - 1 || displayCollection.length === 0"
            @click="navigate(1)"
          >
            <UIcon name="i-lucide-chevron-right" class="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          <!-- Position indicator (py-3 for touch target) -->
          <div class="flex items-center justify-center gap-1.5 py-3 pb-6 sm:pb-8">
            <button
              v-for="(vinyl, index) in displayCollection"
              :key="vinyl.id"
              class="cursor-pointer rounded-full transition-all"
              :class="index === currentIndex
                ? 'h-2 w-6 bg-g-black sm:h-1.5 sm:w-6'
                : 'h-2 w-2 bg-g-200 hover:bg-g-400 sm:h-1.5 sm:w-1.5'"
              :aria-label="`Aller au vinyle ${index + 1}`"
              @click="goTo(index)"
            />
          </div>
        </div>
      </section>

      <!-- Selected vinyl details -->
      <section v-if="selectedVinyl" class="border-b border-g-100 bg-white px-4 sm:px-6">
        <div class="mx-auto max-w-[1400px] py-6 sm:py-10">
          <Transition name="vinyl-detail" mode="out-in">
            <div :key="selectedVinyl.id" class="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
              <!-- Mini cover -->
              <div class="h-24 w-24 shrink-0 overflow-hidden rounded-lg sm:h-28 sm:w-28" :style="{ backgroundColor: selectedVinyl.color }">
                <img
                  v-if="selectedVinyl.cover || selectedVinyl.thumb"
                  :src="selectedVinyl.thumb || selectedVinyl.cover"
                  :alt="selectedVinyl.title"
                  class="h-full w-full object-cover"
                >
                <div v-else class="flex h-full w-full items-center justify-center">
                  <span class="select-none text-xl font-bold text-white/30 sm:text-2xl">
                    {{ getInitials(selectedVinyl.artist) }}
                  </span>
                </div>
              </div>

              <!-- Info -->
              <div class="min-w-0 flex-1 text-center sm:text-left">
                <h2 class="text-xl font-bold tracking-tight text-g-black sm:text-2xl">{{ selectedVinyl.title }}</h2>
                <p class="mt-1 text-base text-g-400 sm:text-lg">{{ selectedVinyl.artist }}</p>

                <div class="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm sm:mt-4 sm:justify-start sm:gap-x-6">
                  <span class="text-g-500">{{ selectedVinyl.year }}</span>
                  <span class="text-g-500">{{ selectedVinyl.label }}</span>
                  <span class="text-g-500">{{ selectedVinyl.genre }}</span>
                  <span class="rounded-lg bg-g-100 px-2 py-0.5 text-xs font-medium text-g-black">{{ selectedVinyl.condition }}</span>
                </div>

                <div v-if="selectedVinyl.added" class="mt-3 flex flex-wrap items-center justify-center gap-4 sm:mt-4 sm:justify-start">
                  <p class="text-sm text-g-400">
                    Ajouté le {{ selectedVinyl.added }}
                  </p>
                </div>
              </div>

              <!-- Actions (full width on mobile for touch) -->
              <div class="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
                <NuxtLink
                  :to="`/vinyl/${selectedVinyl.id}`"
                  class="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-g-black px-5 py-2.5 text-sm font-medium text-g-white transition-colors hover:bg-g-700"
                >
                  <UIcon name="i-lucide-external-link" class="h-4 w-4" />
                  Voir sur le marché
                </NuxtLink>
                <button
                  class="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-g-200 px-5 py-2.5 text-sm text-g-500 transition-colors hover:border-red-400 hover:text-red-400"
                  @click="handleRemove(selectedVinyl.id)"
                >
                  <UIcon name="i-lucide-trash-2" class="h-4 w-4" />
                  Retirer
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </section>
    </template>

    <!-- ═══════════════════════════════════════ -->
    <!-- ─── GRID MODE ─── -->
    <!-- ═══════════════════════════════════════ -->
    <section v-else-if="viewMode === 'grid'" class="px-4 py-6 sm:px-6 sm:py-10">
      <div class="mx-auto grid max-w-[1400px] grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        <div
          v-for="vinyl in collection"
          :key="vinyl.id"
          class="group cursor-pointer"
        >
          <NuxtLink :to="`/vinyl/${vinyl.id}`" class="block">
            <div class="relative aspect-square overflow-hidden rounded-lg transition-transform group-hover:scale-[1.03]" :style="{ backgroundColor: vinyl.color }">
              <img
                v-if="vinyl.cover || vinyl.thumb"
                :src="vinyl.cover || vinyl.thumb"
                :alt="vinyl.title"
                class="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              >
              <div v-else class="flex h-full w-full items-center justify-center">
                <span class="select-none text-3xl font-bold text-white/25">
                  {{ getInitials(vinyl.artist) }}
                </span>
              </div>
              <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
                <p class="truncate text-sm font-medium text-white">{{ vinyl.title }}</p>
                <p class="truncate text-xs text-white/60">{{ vinyl.artist }}</p>
              </div>
            </div>
          </NuxtLink>
          <div class="mt-2 flex items-center justify-between">
            <span class="text-[11px] text-g-400">{{ vinyl.label }} · {{ vinyl.year }}</span>
            <button
              class="min-h-[36px] min-w-[36px] cursor-pointer rounded-lg bg-g-100 p-2 text-g-500 transition-colors hover:bg-red-50 hover:text-red-500"
              title="Retirer de ma collection"
              @click.prevent="handleRemove(vinyl.id)"
            >
              <UIcon name="i-lucide-trash-2" class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <RewindOverlay v-if="displayCollection.length" v-model:show="showRewind" :results="rawResults" />
  </div>
</template>

<style scoped>
.carousel-card {
  width: 200px;
  height: 200px;
  margin-left: -100px;
  margin-top: -100px;
  transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  transform-style: preserve-3d;
  cursor: pointer;
}
@media (min-width: 640px) {
  .carousel-card {
    width: 280px;
    height: 280px;
    margin-left: -140px;
    margin-top: -140px;
  }
}

.cover {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 2;
}

/* ─── Vinyl Disc ─── */
.disc-wrapper {
  position: absolute;
  inset: 0;
  z-index: 1;
  transition: transform 0.8s cubic-bezier(0.23, 1, 0.32, 1);
  transform: translateX(0);
}

.disc-wrapper.is-active {
  transform: translateX(35%);
}

.disc {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background:
    radial-gradient(circle at center,
      #333 0%, #333 14%,
      var(--disc-color, #555) 14%, var(--disc-color, #555) 28%,
      #181818 28%, #1e1e1e 30%,
      #151515 32%, #1c1c1c 38%,
      #141414 40%, #1a1a1a 48%,
      #131313 50%, #191919 58%,
      #121212 60%, #181818 68%,
      #111111 70%, #171717 78%,
      #101010 80%, #161616 88%,
      #0f0f0f 90%, #151515 100%
    );
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
}

.disc-wrapper.is-active .disc {
  animation: vinyl-spin 4s linear infinite;
}

/* ─── Detail transition ─── */
.vinyl-detail-enter-active,
.vinyl-detail-leave-active {
  transition: all 0.3s ease;
}

.vinyl-detail-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.vinyl-detail-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
