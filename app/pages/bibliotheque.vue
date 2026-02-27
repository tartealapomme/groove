<script lang="ts" setup>
import logoBlanc from '~/assets/img/groov_logo_blanc.svg'
import logoNoir from '~/assets/img/groov_logo_noir.svg'

const { openLogin, openRegister } = useAuthModal()
const searchQuery = ref('')

type ViewMode = 'showcase' | 'grid'
const viewMode = ref<ViewMode>('showcase')
const currentIndex = ref(0)
const isTransitioning = ref(false)

const collection = [
  { id: 'dark-side', title: 'The Dark Side of the Moon', artist: 'Pink Floyd', year: '1973', genre: 'Rock', label: 'Harvest', condition: 'NM', color: '#1a1a2e', value: 285, added: '15 jan. 2025' },
  { id: 'kind-of-blue', title: 'Kind of Blue', artist: 'Miles Davis', year: '1959', genre: 'Jazz', label: 'Columbia', condition: 'VG+', color: '#0f3460', value: 420, added: '20 fév. 2025' },
  { id: 'discovery', title: 'Discovery', artist: 'Daft Punk', year: '2001', genre: 'Electronic', label: 'Virgin', condition: 'NM', color: '#e94560', value: 95, added: '10 mar. 2025' },
  { id: 'ok-computer', title: 'OK Computer', artist: 'Radiohead', year: '1997', genre: 'Rock', label: 'Parlophone', condition: 'NM', color: '#533483', value: 145, added: '5 avr. 2025' },
  { id: 'rumours', title: 'Rumours', artist: 'Fleetwood Mac', year: '1977', genre: 'Rock', label: 'Warner Bros', condition: 'VG+', color: '#4a3728', value: 68, added: '12 mai 2025' },
  { id: 'whats-going-on', title: "What's Going On", artist: 'Marvin Gaye', year: '1971', genre: 'Soul', label: 'Tamla', condition: 'VG', color: '#2d6a4f', value: 180, added: '18 juin 2025' },
  { id: 'homework', title: 'Homework', artist: 'Daft Punk', year: '1997', genre: 'Electronic', label: 'Virgin', condition: 'NM', color: '#d4a373', value: 110, added: '22 juil. 2025' },
  { id: 'illmatic', title: 'Illmatic', artist: 'Nas', year: '1994', genre: 'Hip-Hop', label: 'Columbia', condition: 'NM', color: '#6b705c', value: 75, added: '30 août 2025' },
  { id: 'loveless', title: 'Loveless', artist: 'My Bloody Valentine', year: '1991', genre: 'Rock', label: 'Creation', condition: 'VG+', color: '#c9184a', value: 320, added: '15 sept. 2025' },
  { id: 'abbey-road', title: 'Abbey Road', artist: 'The Beatles', year: '1969', genre: 'Rock', label: 'Apple', condition: 'VG+', color: '#5c7a99', value: 195, added: '2 oct. 2025' },
  { id: 'blue-train', title: 'Blue Train', artist: 'John Coltrane', year: '1958', genre: 'Jazz', label: 'Blue Note', condition: 'VG', color: '#1a365d', value: 380, added: '8 nov. 2025' },
  { id: 'remain-in-light', title: 'Remain in Light', artist: 'Talking Heads', year: '1980', genre: 'Rock', label: 'Sire', condition: 'NM', color: '#c44536', value: 130, added: '25 déc. 2025' },
]

const selectedVinyl = computed(() => collection[currentIndex.value])

const stats = computed(() => {
  const genres = new Set(collection.map(v => v.genre)).size
  const totalValue = collection.reduce((sum, v) => sum + v.value, 0)
  return { total: collection.length, genres, totalValue }
})

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
}

function getCardStyle(index: number) {
  const offset = index - currentIndex.value
  const absOffset = Math.abs(offset)
  const sign = Math.sign(offset)

  if (absOffset > 5) {
    return { opacity: '0', pointerEvents: 'none' as const, transform: `translateX(${sign * 900}px)` }
  }

  if (offset === 0) {
    return {
      transform: 'translateZ(80px) scale(1)',
      opacity: '1',
      zIndex: 20,
      filter: 'brightness(1)',
    }
  }

  const tx = sign * 240 + sign * (absOffset - 1) * 75
  const ry = sign * -48
  const tz = -absOffset * 50

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
  if (next < 0 || next >= collection.length) return
  isTransitioning.value = true
  currentIndex.value = next
  setTimeout(() => (isTransitioning.value = false), 500)
}

function goTo(index: number) {
  if (isTransitioning.value || index === currentIndex.value) return
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

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  currentIndex.value = Math.min(2, Math.floor(collection.length / 2))
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
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

    <!-- ─── TITLE + STATS ─── -->
    <section class="border-b border-g-100 bg-white px-6">
      <div class="mx-auto flex max-w-[1400px] flex-col gap-4 py-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-g-black">Ma Collection</h1>
          <p class="mt-1 text-sm text-g-400">
            {{ stats.total }} vinyles · {{ stats.genres }} genres · Valeur estimée
            <span class="font-medium text-g-black">{{ stats.totalValue.toLocaleString('fr-FR') }}€</span>
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-all"
            :class="viewMode === 'showcase' ? 'bg-g-black text-g-white' : 'text-g-400 hover:bg-g-100 hover:text-g-950'"
            @click="viewMode = 'showcase'"
          >
            <UIcon name="i-lucide-disc-3" class="h-4 w-4" />
            Vitrine
          </button>
          <button
            class="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-all"
            :class="viewMode === 'grid' ? 'bg-g-black text-g-white' : 'text-g-400 hover:bg-g-100 hover:text-g-950'"
            @click="viewMode = 'grid'"
          >
            <UIcon name="i-lucide-grid-3x3" class="h-4 w-4" />
            Grille
          </button>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════ -->
    <!-- ─── 3D SHOWCASE MODE ─── -->
    <!-- ═══════════════════════════════════════ -->
    <template v-if="viewMode === 'showcase'">
      <!-- Carousel -->
      <section
        class="relative overflow-hidden bg-white px-6"
        @wheel.prevent="onWheel"
        @touchstart="onTouchStart"
        @touchend="onTouchEnd"
      >
        <!-- Ambient glow -->
        <div
          class="pointer-events-none absolute inset-0 opacity-30 transition-colors duration-700"
          :style="{ background: `radial-gradient(ellipse at 50% 60%, ${selectedVinyl.color}44 0%, transparent 70%)` }"
        />

        <div class="relative mx-auto max-w-[1400px]">
          <!-- Carousel container -->
          <div class="carousel-stage relative mx-auto h-[480px] w-full" style="perspective: 1200px">
            <div
              v-for="(vinyl, index) in collection"
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
              <div
                class="cover relative flex items-center justify-center overflow-hidden rounded-lg shadow-2xl"
                :style="{ backgroundColor: vinyl.color }"
              >
                <span class="select-none text-4xl font-bold text-white/30">
                  {{ getInitials(vinyl.artist) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Navigation arrows -->
          <button
            class="absolute left-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-g-100 bg-white text-g-black shadow-sm transition-all hover:bg-g-50 disabled:pointer-events-none disabled:opacity-20"
            :disabled="currentIndex === 0"
            @click="navigate(-1)"
          >
            <UIcon name="i-lucide-chevron-left" class="h-6 w-6" />
          </button>
          <button
            class="absolute right-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-g-100 bg-white text-g-black shadow-sm transition-all hover:bg-g-50 disabled:pointer-events-none disabled:opacity-20"
            :disabled="currentIndex === collection.length - 1"
            @click="navigate(1)"
          >
            <UIcon name="i-lucide-chevron-right" class="h-6 w-6" />
          </button>

          <!-- Position indicator -->
          <div class="flex items-center justify-center gap-1.5 pb-8 pt-2">
            <button
              v-for="(vinyl, index) in collection"
              :key="vinyl.id"
              class="h-1.5 cursor-pointer rounded-full transition-all"
              :class="index === currentIndex ? 'w-6 bg-g-black' : 'w-1.5 bg-g-200 hover:bg-g-400'"
              @click="goTo(index)"
            />
          </div>
        </div>
      </section>

      <!-- Selected vinyl details -->
      <section class="border-b border-g-100 bg-white px-6">
        <div class="mx-auto max-w-[1400px] py-10">
          <Transition name="vinyl-detail" mode="out-in">
            <div :key="selectedVinyl.id" class="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
              <!-- Mini cover -->
              <div
                class="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg"
                :style="{ backgroundColor: selectedVinyl.color }"
              >
                <span class="select-none text-2xl font-bold text-white/30">
                  {{ getInitials(selectedVinyl.artist) }}
                </span>
              </div>

              <!-- Info -->
              <div class="flex-1 text-center sm:text-left">
                <h2 class="text-2xl font-bold tracking-tight text-g-black">{{ selectedVinyl.title }}</h2>
                <p class="mt-1 text-lg text-g-400">{{ selectedVinyl.artist }}</p>

                <div class="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm sm:justify-start">
                  <span class="text-g-500">{{ selectedVinyl.year }}</span>
                  <span class="text-g-500">{{ selectedVinyl.label }}</span>
                  <span class="text-g-500">{{ selectedVinyl.genre }}</span>
                  <span class="rounded-lg bg-g-100 px-2 py-0.5 text-xs font-medium text-g-black">{{ selectedVinyl.condition }}</span>
                </div>

                <div class="mt-4 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                  <p class="text-sm text-g-400">
                    Valeur estimée : <span class="font-semibold text-g-black">{{ selectedVinyl.value }}€</span>
                  </p>
                  <p class="text-sm text-g-400">
                    Ajouté le {{ selectedVinyl.added }}
                  </p>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex shrink-0 flex-col gap-2">
                <NuxtLink
                  :to="`/vinyl/${selectedVinyl.id}`"
                  class="flex cursor-pointer items-center gap-2 rounded-lg bg-g-black px-5 py-2.5 text-sm font-medium text-g-white transition-colors hover:bg-g-700"
                >
                  <UIcon name="i-lucide-external-link" class="h-4 w-4" />
                  Voir sur le marché
                </NuxtLink>
                <button class="flex cursor-pointer items-center gap-2 rounded-lg border border-g-200 px-5 py-2.5 text-sm text-g-500 transition-colors hover:border-g-400 hover:text-g-950">
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
    <section v-if="viewMode === 'grid'" class="px-6 py-10">
      <div class="mx-auto grid max-w-[1400px] grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        <NuxtLink
          v-for="vinyl in collection"
          :key="vinyl.id"
          :to="`/vinyl/${vinyl.id}`"
          class="group cursor-pointer"
        >
          <div
            class="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg transition-transform group-hover:scale-[1.03]"
            :style="{ backgroundColor: vinyl.color }"
          >
            <span class="select-none text-3xl font-bold text-white/25">
              {{ getInitials(vinyl.artist) }}
            </span>
            <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
              <p class="truncate text-sm font-medium text-white">{{ vinyl.title }}</p>
              <p class="truncate text-xs text-white/60">{{ vinyl.artist }}</p>
            </div>
          </div>
          <div class="mt-2 flex items-center justify-between">
            <span class="rounded-lg bg-g-100 px-1.5 py-0.5 text-[10px] font-medium text-g-black">{{ vinyl.condition }}</span>
            <span class="text-xs font-medium text-g-black">{{ vinyl.value }}€</span>
          </div>
        </NuxtLink>
      </div>
    </section>

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

<style scoped>
.carousel-card {
  width: 280px;
  height: 280px;
  margin-left: -140px;
  margin-top: -140px;
  transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  transform-style: preserve-3d;
  cursor: pointer;
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
