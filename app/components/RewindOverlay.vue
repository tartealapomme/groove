<script lang="ts" setup>
import logoBlanc from '~/assets/img/groov_logo_blanc.svg'
import type { DiscogsSearchResult } from '~/composables/useDiscogs'
import type { RewindStats } from '~/composables/useRewindStats'

const props = defineProps<{
  results: DiscogsSearchResult[]
}>()

const show = defineModel<boolean>('show', { default: false })

const resultsRef = computed(() => props.results)
const { stats } = useRewindStats(resultsRef)

const currentSlide = ref(0)
const totalSlides = 6
const vis = ref(false)
const shareUrl = ref('')
const isExporting = ref(false)
const shareCopied = ref(false)

const totalDisplay = ref(0)
const countriesDisplay = ref(0)

function go(dir: 1 | -1) {
  const next = currentSlide.value + dir
  if (next < 0 || next >= totalSlides) return
  vis.value = false
  setTimeout(() => {
    currentSlide.value = next
    vis.value = true
  }, 200)
}

function onContentClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.closest('button') || target.closest('a')) return
  if (currentSlide.value < totalSlides - 1) go(1)
}

function close() {
  show.value = false
  currentSlide.value = 0
}

watch(show, (v) => {
  if (v) {
    currentSlide.value = 0
    shareUrl.value = typeof window !== 'undefined' ? window.location.origin : ''
    setTimeout(() => {
      vis.value = true
      animateCounters()
    }, 250)
  }
})

function animateCounters() {
  const duration = 800
  const start = Date.now()
  function tick() {
    const t = Math.min((Date.now() - start) / duration, 1)
    const eased = 1 - Math.pow(2, -8 * t)
    totalDisplay.value = Math.round((stats.value.totalVinyls ?? 0) * eased)
    countriesDisplay.value = Math.round((stats.value.totalCountries ?? 0) * eased)
    if (t < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

watch([vis, currentSlide], ([v, slide]) => {
  if (v && (slide === 0 || slide === 1)) animateCounters()
})

function barW(count: number) {
  const max = stats.value.topCountries[0]?.count ?? 1
  return `${Math.max(8, (count / max) * 100)}%`
}

function onKey(e: KeyboardEvent) {
  if (!show.value) return
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(1) }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
  else if (e.key === 'Escape') close()
}

async function copyShareLink() {
  const text = `Ma collection Groov : ${stats.value.totalVinyls} vinyles, ${stats.value.totalCountries} pays. Découvre la tienne ! ${shareUrl.value}`
  try {
    await navigator.clipboard.writeText(text)
    shareCopied.value = true
    setTimeout(() => { shareCopied.value = false }, 2000)
  }
  catch {
    shareUrl.value = text
  }
}

async function exportImage() {
  if (isExporting.value) return
  isExporting.value = true
  try {
    const { default: html2canvas } = await import('html2canvas')
    const el = document.querySelector('.rewind-export-area') as HTMLElement
    if (!el) return
    const canvas = await html2canvas(el, {
      backgroundColor: '#171717',
      scale: 2,
      useCORS: true,
      logging: false,
    })
    const link = document.createElement('a')
    link.download = `groov-rewind-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
  catch (err) {
    console.error('Export failed:', err)
  }
  finally {
    isExporting.value = false
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="rewind-overlay-enter"
      enter-from-class="rewind-overlay-enter-from"
      enter-to-class="rewind-overlay-enter-to"
      leave-active-class="rewind-overlay-leave"
      leave-from-class="rewind-overlay-leave-from"
      leave-to-class="rewind-overlay-leave-to"
    >
      <div
        v-if="show"
        class="rewind-overlay fixed inset-0 z-[100] flex flex-col overflow-hidden bg-g-black"
      >
        <!-- Fond : gradients lumineux légers (sans blur pour la perf) -->
        <div class="rewind-bg pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div class="rewind-spotlight" />
          <div class="rewind-glow rewind-glow-1" />
          <div class="rewind-glow rewind-glow-2" />
        </div>

        <!-- Top bar -->
        <div class="relative z-10 flex shrink-0 items-center justify-between px-6 py-5">
          <div class="w-8" />
          <div class="flex flex-1 items-center justify-center gap-1.5">
            <div
              v-for="i in totalSlides"
              :key="i"
              class="rewind-progress-dot h-[3px] flex-1 rounded-full transition-all duration-500"
              :class="i - 1 <= currentSlide ? 'bg-g-white' : 'bg-g-800'"
            />
          </div>
          <button
            type="button"
            class="rewind-close-btn ml-6 cursor-pointer rounded-lg p-1.5 text-g-600 transition-all duration-200 hover:scale-110 hover:text-g-white focus:outline-none focus:ring-2 focus:ring-g-white/30"
            @click="close"
          >
            <UIcon name="i-lucide-x" class="h-5 w-5" />
          </button>
        </div>

        <!-- Content : clic n'importe où pour avancer -->
        <div
          class="rewind-content relative z-10 flex flex-1 cursor-pointer flex-col items-center justify-center px-6 pb-12"
          @click="onContentClick"
        >
          <Transition
            enter-active-class="rewind-slide-enter"
            enter-from-class="rewind-slide-enter-from"
            enter-to-class="rewind-slide-enter-to"
            leave-active-class="rewind-slide-leave"
            leave-from-class="rewind-slide-leave-from"
            leave-to-class="rewind-slide-leave-to"
            mode="out-in"
          >
            <!-- 0 — Intro -->
            <div v-if="currentSlide === 0" key="s0" class="rewind-export-area rewind-card flex max-w-2xl flex-col items-center rounded-2xl p-8 text-center">
              <p
                class="rewind-reveal font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em] text-g-300"
                :class="vis ? 'rewind-reveal-visible' : ''"
              >
                <span class="inline-block" style="letter-spacing: 0.2em">Rewind</span>
              </p>
              <h1
                class="rewind-reveal rewind-title mt-5 text-balance text-4xl font-bold tracking-tight text-g-white sm:text-5xl"
                :class="vis ? 'rewind-reveal-visible' : ''"
                style="--delay: 0.15s"
              >
                Votre collection<br>en un coup d'œil.
              </h1>
              <p
                class="rewind-reveal mt-6 font-[family-name:var(--font-mono)] text-3xl font-bold text-g-white"
                :class="vis ? 'rewind-reveal-visible' : ''"
                style="--delay: 0.4s"
              >
                <span class="rewind-counter">{{ totalDisplay }}</span>
                <span class="text-base font-normal text-g-500"> pressages dans votre collection</span>
              </p>
            </div>

            <!-- 1 — Top Pays -->
            <div v-else-if="currentSlide === 1" key="s1" class="rewind-export-area rewind-card w-full max-w-md rounded-2xl p-8">
              <p
                class="rewind-reveal text-center font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em] text-g-300"
                :class="vis ? 'rewind-reveal-visible' : ''"
              >
                Origines
              </p>
              <p
                class="rewind-reveal mt-3 text-center text-3xl font-bold text-g-white sm:text-[32px]"
                :class="vis ? 'rewind-reveal-visible' : ''"
                style="--delay: 0.15s"
              >
                <span class="rewind-counter font-[family-name:var(--font-mono)]">{{ countriesDisplay }}</span> pays
              </p>
              <div class="mt-10 space-y-3">
                <div
                  v-for="(c, i) in stats.topCountries.slice(0, 5)"
                  :key="c.name"
                  class="rewind-reveal rewind-bar-row flex items-center gap-3"
                  :class="vis ? 'rewind-reveal-visible' : ''"
                  :style="{ '--delay': `${0.3 + i * 0.08}s` }"
                >
                  <span class="w-5 text-right font-[family-name:var(--font-mono)] text-[11px] text-g-600">{{ i + 1 }}</span>
                  <div class="flex-1">
                    <div class="mb-1 flex justify-between">
                      <span class="text-sm text-g-white">{{ c.name }}</span>
                      <span class="font-[family-name:var(--font-mono)] text-[11px] text-g-500">{{ c.count }}</span>
                    </div>
                    <div class="h-1 overflow-hidden rounded-full bg-g-800">
                      <div
                        class="rewind-bar-fill h-full rounded-full bg-g-white transition-all duration-500 ease-out"
                        :style="{ width: vis ? barW(c.count) : '0%', transitionDelay: `${0.5 + i * 0.1}s` }"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2 — Top Genres -->
            <div v-else-if="currentSlide === 2" key="s2" class="rewind-export-area rewind-card flex w-full max-w-md flex-col items-center rounded-2xl p-8">
              <p
                class="rewind-reveal font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em] text-g-300"
                :class="vis ? 'rewind-reveal-visible' : ''"
              >
                Genres
              </p>
              <div class="mt-8 flex flex-wrap justify-center gap-2">
                <span
                  v-for="(g, i) in stats.topGenres"
                  :key="g.name"
                  class="rewind-pill rewind-reveal rounded-full border px-5 py-2 text-sm transition-all duration-300"
                  :class="[
                    vis ? 'rewind-reveal-visible' : '',
                    i === 0 ? 'border-g-white bg-g-white text-g-black font-semibold' : 'border-g-600 text-g-300 hover:border-g-500 hover:scale-105',
                  ]"
                  :style="{ '--delay': `${0.2 + i * 0.1}s` }"
                >
                  {{ g.name }}
                  <span
                    class="ml-1 font-[family-name:var(--font-mono)] text-[11px]"
                    :class="i === 0 ? 'text-g-500' : 'text-g-600'"
                  >{{ g.count }}</span>
                </span>
              </div>
            </div>

            <!-- 3 — Top Artistes -->
            <div v-else-if="currentSlide === 3" key="s3" class="rewind-export-area rewind-card w-full max-w-md rounded-2xl p-8">
              <p
                class="rewind-reveal text-center font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em] text-g-300"
                :class="vis ? 'rewind-reveal-visible' : ''"
              >
                Artistes
              </p>
              <div class="mt-8 space-y-5">
                <div
                  v-for="(a, i) in stats.topArtists"
                  :key="a.name"
                  class="rewind-reveal rewind-artist-row flex items-center gap-4"
                  :class="vis ? 'rewind-reveal-visible' : ''"
                  :style="{ '--delay': `${0.3 + i * 0.12}s` }"
                >
                  <span
                    class="rewind-artist-badge flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-mono)] text-sm font-bold transition-transform hover:scale-110"
                    :class="i === 0 ? 'bg-g-white text-g-black' : 'border border-g-700 text-g-500 hover:border-g-600'"
                  >{{ i + 1 }}</span>
                  <div class="min-w-0">
                    <p class="truncate font-semibold text-g-white">{{ a.name }}</p>
                    <p class="font-[family-name:var(--font-mono)] text-[11px] text-g-600">{{ a.count }} vinyle{{ a.count > 1 ? 's' : '' }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4 — Pièce rare -->
            <div v-else-if="currentSlide === 4" key="s4" class="rewind-export-area rewind-card flex w-full max-w-xs flex-col items-center rounded-2xl p-8">
              <p
                class="rewind-reveal font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em] text-g-300"
                :class="vis ? 'rewind-reveal-visible' : ''"
              >
                Pièce rare
              </p>
              <div v-if="stats.rarestVinyl" class="mt-6 flex flex-col items-center">
                <div
                  class="rewind-reveal overflow-hidden rounded-xl transition-all duration-500"
                  :class="vis ? 'rewind-reveal-visible' : ''"
                  style="--delay: 0.2s"
                >
                  <div class="rewind-cover-hover overflow-hidden rounded-xl shadow-2xl">
                    <img
                      v-if="stats.rarestVinyl.cover"
                      :src="stats.rarestVinyl.cover"
                      :alt="stats.rarestVinyl.title"
                      class="h-44 w-44 object-cover transition-transform duration-500 sm:h-52 sm:w-52"
                      decoding="async"
                    >
                    <div v-else class="flex h-44 w-44 items-center justify-center bg-g-800 sm:h-52 sm:w-52">
                      <UIcon name="i-lucide-disc-3" class="h-12 w-12 text-g-600" />
                    </div>
                  </div>
                </div>
                <p
                  class="rewind-reveal mt-4 text-center font-semibold text-g-white"
                  :class="vis ? 'rewind-reveal-visible' : ''"
                  style="--delay: 0.4s"
                >
                  {{ stats.rarestVinyl.title }}
                </p>
                <p
                  class="rewind-reveal mt-1 text-sm text-g-500"
                  :class="vis ? 'rewind-reveal-visible' : ''"
                  style="--delay: 0.5s"
                >
                  {{ stats.rarestVinyl.artist }}
                </p>
                <div
                  class="rewind-reveal mt-4 flex gap-8"
                  :class="vis ? 'rewind-reveal-visible' : ''"
                  style="--delay: 0.6s"
                >
                  <div class="text-center">
                    <p class="font-[family-name:var(--font-mono)] text-lg font-bold text-g-white">{{ stats.rarestVinyl.want.toLocaleString('fr-FR') }}</p>
                    <p class="text-[10px] text-g-600">wants</p>
                  </div>
                  <div class="text-center">
                    <p class="font-[family-name:var(--font-mono)] text-lg font-bold text-g-white">{{ stats.rarestVinyl.have.toLocaleString('fr-FR') }}</p>
                    <p class="text-[10px] text-g-600">haves</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 5 — Récap + Partage -->
            <div v-else key="s5" class="rewind-export-area rewind-card flex w-full max-w-sm flex-col items-center rounded-2xl p-8">
              <div
                class="rewind-reveal mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-g-700 transition-transform hover:scale-110"
                :class="vis ? 'rewind-reveal-visible' : ''"
              >
                <UIcon name="i-lucide-disc-3" class="h-6 w-6 text-g-white" />
              </div>
              <h2
                class="rewind-reveal text-center text-2xl font-bold text-g-white sm:text-3xl"
                :class="vis ? 'rewind-reveal-visible' : ''"
                style="--delay: 0.15s"
              >
                Votre collection,<br>votre identité.
              </h2>
              <div
                class="rewind-reveal mt-6 flex flex-wrap justify-center gap-2"
                :class="vis ? 'rewind-reveal-visible' : ''"
                style="--delay: 0.3s"
              >
                <span class="rounded-full border border-g-700 px-4 py-1.5 font-[family-name:var(--font-mono)] text-sm text-g-400 transition-colors hover:border-g-600 hover:text-g-300">
                  {{ stats.totalVinyls }} vinyles
                </span>
                <span class="rounded-full border border-g-700 px-4 py-1.5 font-[family-name:var(--font-mono)] text-sm text-g-400 transition-colors hover:border-g-600 hover:text-g-300">
                  {{ stats.totalCountries }} pays
                </span>
                <span class="rounded-full border border-g-700 px-4 py-1.5 font-[family-name:var(--font-mono)] text-sm text-g-400 transition-colors hover:border-g-600 hover:text-g-300">
                  {{ stats.topGenres.length }} genres
                </span>
              </div>

              <!-- Partage -->
              <div class="rewind-reveal mt-6 flex flex-wrap justify-center gap-2" :class="vis ? 'rewind-reveal-visible' : ''" style="--delay: 0.45s">
                <button
                  type="button"
                  class="rewind-share-btn flex cursor-pointer items-center gap-2 rounded-full border border-g-600 px-4 py-2.5 text-sm text-g-300 transition-all hover:scale-105 hover:border-g-500 hover:text-g-white focus:outline-none focus:ring-2 focus:ring-g-white/30"
                  @click="copyShareLink"
                >
                  <UIcon :name="shareCopied ? 'i-lucide-check' : 'i-lucide-share-2'" class="h-4 w-4" />
                  {{ shareCopied ? 'Copié !' : 'Copier le lien' }}
                </button>
                <button
                  type="button"
                  class="rewind-share-btn flex cursor-pointer items-center gap-2 rounded-full border border-g-600 px-4 py-2.5 text-sm text-g-300 transition-all hover:scale-105 hover:border-g-500 hover:text-g-white focus:outline-none focus:ring-2 focus:ring-g-white/30 disabled:opacity-50"
                  :disabled="isExporting"
                  @click="exportImage"
                >
                  <UIcon :name="isExporting ? 'i-lucide-loader-2' : 'i-lucide-image'" class="h-4 w-4" :class="{ 'animate-spin': isExporting }" />
                  {{ isExporting ? 'Export…' : 'Exporter en image' }}
                </button>
              </div>

              <UButton
                size="lg"
                class="rewind-reveal mt-6 cursor-pointer rounded-full bg-g-white px-10 py-3 text-sm font-semibold text-g-black transition-all hover:scale-105 hover:bg-g-200 focus:ring-2 focus:ring-g-white/50"
                :class="vis ? 'rewind-reveal-visible' : ''"
                style="--delay: 0.6s"
                @click="close"
              >
                Fermer
              </UButton>
            </div>
          </Transition>
          <p v-if="currentSlide < totalSlides - 1" class="rewind-tap-hint absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-g-500">
            Cliquez pour continuer
          </p>
        </div>

        <!-- Bottom nav -->
        <div class="flex shrink-0 items-center justify-between px-6 pb-6">
          <button
            type="button"
            class="rewind-nav-btn flex cursor-pointer items-center gap-1 rounded-lg px-2 py-2 text-sm text-g-600 transition-all hover:scale-105 hover:text-g-white focus:outline-none focus:ring-2 focus:ring-g-white/30 disabled:cursor-default disabled:opacity-0 disabled:hover:scale-100"
            :disabled="currentSlide <= 0"
            @click="go(-1)"
          >
            <UIcon name="i-lucide-chevron-left" class="h-4 w-4" />
          </button>
          <img :src="logoBlanc" alt="GROOV" class="h-3.5 opacity-20">
          <button
            v-if="currentSlide < totalSlides - 1"
            type="button"
            class="rewind-nav-btn flex cursor-pointer items-center gap-1 rounded-lg px-2 py-2 text-sm text-g-white transition-all hover:scale-105 hover:text-g-300 focus:outline-none focus:ring-2 focus:ring-g-white/30"
            @click="go(1)"
          >
            <UIcon name="i-lucide-chevron-right" class="h-4 w-4" />
          </button>
          <span v-else class="w-5" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Overlay enter/leave : rapide */
.rewind-overlay-enter { transition: opacity 0.35s ease-out; }
.rewind-overlay-enter-from { opacity: 0; }
.rewind-overlay-enter-to { opacity: 1; }
.rewind-overlay-leave { transition: opacity 0.25s ease-in; }
.rewind-overlay-leave-from { opacity: 1; }
.rewind-overlay-leave-to { opacity: 0; }

/* Slide transitions : rapides, sans blur (perf) */
.rewind-slide-enter { transition: opacity 0.25s ease-out, transform 0.25s ease-out; }
.rewind-slide-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.rewind-slide-enter-to {
  opacity: 1;
  transform: translateY(0);
}
.rewind-slide-leave { transition: opacity 0.2s ease-in, transform 0.2s ease-in; }
.rewind-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.rewind-slide-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

/* Reveal : snappy */
.rewind-reveal {
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.25s ease-out, transform 0.25s ease-out;
  transition-delay: var(--delay, 0s);
}
.rewind-reveal-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Fond : lumière et punch */
.rewind-bg {
  background:
    radial-gradient(ellipse 100% 60% at 50% 0%, rgba(255, 255, 255, 0.08) 0%, transparent 55%),
    radial-gradient(ellipse 70% 50% at 80% 80%, rgba(255, 255, 255, 0.04) 0%, transparent 50%);
}
.rewind-spotlight {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 80% 50% at 50% 30%,
    rgba(255, 255, 255, 0.06) 0%,
    transparent 60%
  );
  pointer-events: none;
}
.rewind-glow {
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  opacity: 0.4;
  pointer-events: none;
  will-change: transform;
}
.rewind-glow-1 {
  top: -150px;
  left: -100px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, transparent 70%);
}
.rewind-glow-2 {
  bottom: -100px;
  right: -150px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.06) 0%, transparent 70%);
}

/* Cover hover */
.rewind-cover-hover:hover img {
  transform: scale(1.05);
}

/* Titre avec léger glow */
.rewind-title {
  text-shadow: 0 0 40px rgba(255, 255, 255, 0.15);
}

/* Indice clic */
.rewind-tap-hint {
  animation: rewind-pulse 2s ease-in-out infinite;
}
@keyframes rewind-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
</style>
