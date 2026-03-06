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

function go(dir: 1 | -1) {
  const next = currentSlide.value + dir
  if (next < 0 || next >= totalSlides) return
  vis.value = false
  setTimeout(() => {
    currentSlide.value = next
    vis.value = true
  }, 250)
}

function close() {
  show.value = false
  currentSlide.value = 0
}

watch(show, (v) => {
  if (v) {
    currentSlide.value = 0
    setTimeout(() => { vis.value = true }, 350)
  }
})

function barW(count: number) {
  const max = stats.value.topCountries[0]?.count ?? 1
  return `${Math.max(8, (count / max) * 100)}%`
}

function onKey(e: KeyboardEvent) {
  if (!show.value) return
  if (e.key === 'ArrowRight' || e.key === ' ') go(1)
  else if (e.key === 'ArrowLeft') go(-1)
  else if (e.key === 'Escape') close()
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-300 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-g-black"
      >
        <!-- Ambient background motion -->
        <div class="pointer-events-none absolute inset-0">
          <div class="absolute -left-32 top-1/4 h-72 w-72 rounded-full bg-gradient-to-br from-g-900 via-g-800 to-transparent opacity-60 blur-3xl" />
          <div class="absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-gradient-to-tl from-g-900 via-g-800 to-transparent opacity-60 blur-3xl" />
          <div class="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-g-700/50 to-transparent opacity-70" />
        </div>

        <!-- Top bar -->
        <div class="relative z-10 flex shrink-0 items-center justify-between px-6 py-5">
          <div class="w-8" />
          <div class="flex flex-1 items-center justify-center gap-1.5">
            <div
              v-for="i in totalSlides"
              :key="i"
              class="h-[3px] flex-1 rounded-full transition-all duration-500"
              :class="i - 1 <= currentSlide ? 'bg-g-white' : 'bg-g-800'"
            />
          </div>
          <button class="ml-6 cursor-pointer text-g-600 transition-colors hover:text-g-white" @click="close">
            <UIcon name="i-lucide-x" class="h-5 w-5" />
          </button>
        </div>

        <!-- Content -->
        <div class="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
          <Transition
            enter-active-class="transition duration-500 ease-out"
            enter-from-class="translate-y-6 opacity-0"
            enter-to-class="translate-y-0 opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
            mode="out-in"
          >
            <!-- 0 — Intro -->
            <div v-if="currentSlide === 0" key="s0" class="flex max-w-2xl flex-col items-center text-center">
              <p
                class="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em] text-g-300 transition-all delay-100 duration-700"
                :class="vis ? 'opacity-100' : 'opacity-0'"
              >
                Rewind
              </p>
              <h1
                class="mt-5 text-balance text-4xl font-bold tracking-tight text-g-white transition-all delay-200 duration-700 sm:text-5xl"
                :class="vis ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'"
              >
                Votre collection<br>en un coup d'œil.
              </h1>
              <p
                class="mt-6 font-[family-name:var(--font-mono)] text-3xl font-bold text-g-white transition-all delay-400 duration-700"
                :class="vis ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'"
              >
                {{ stats.totalVinyls }}
                <span class="text-base font-normal text-g-500"> pressages dans votre collection</span>
              </p>
            </div>

            <!-- 1 — Top Pays -->
            <div v-else-if="currentSlide === 1" key="s1" class="w-full max-w-md">
              <p
                class="text-center font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em] text-g-300 transition-all delay-100 duration-700"
                :class="vis ? 'opacity-100' : 'opacity-0'"
              >
                Origines
              </p>
              <p
                class="mt-3 text-center text-3xl font-bold text-g-white transition-all delay-200 duration-700 sm:text-[32px]"
                :class="vis ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'"
              >
                <span class="font-[family-name:var(--font-mono)]">{{ stats.totalCountries }}</span> pays
              </p>
              <div class="mt-10 space-y-3">
                <div
                  v-for="(c, i) in stats.topCountries.slice(0, 5)"
                  :key="c.name"
                  class="flex items-center gap-3 transition-all duration-500"
                  :class="vis ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'"
                  :style="{ transitionDelay: `${300 + i * 80}ms` }"
                >
                  <span class="w-5 text-right font-[family-name:var(--font-mono)] text-[11px] text-g-600">{{ i + 1 }}</span>
                  <div class="flex-1">
                    <div class="mb-1 flex justify-between">
                      <span class="text-sm text-g-white">{{ c.name }}</span>
                      <span class="font-[family-name:var(--font-mono)] text-[11px] text-g-500">{{ c.count }}</span>
                    </div>
                    <div class="h-1 overflow-hidden rounded-full bg-g-800">
                      <div
                        class="h-full rounded-full bg-g-white transition-all delay-500 duration-700"
                        :style="{ width: vis ? barW(c.count) : '0%' }"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2 — Top Genres -->
            <div v-else-if="currentSlide === 2" key="s2" class="flex w-full max-w-md flex-col items-center">
              <p
                class="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em] text-g-300 transition-all delay-100 duration-700"
                :class="vis ? 'opacity-100' : 'opacity-0'"
              >
                Genres
              </p>
              <div class="mt-8 flex flex-wrap justify-center gap-2">
                <span
                  v-for="(g, i) in stats.topGenres"
                  :key="g.name"
                  class="rounded-full border px-5 py-2 text-sm transition-all duration-500"
                  :class="[
                    vis ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
                    i === 0 ? 'border-g-white bg-g-white text-g-black font-semibold' : 'border-g-600 text-g-300',
                  ]"
                  :style="{ transitionDelay: `${200 + i * 100}ms` }"
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
            <div v-else-if="currentSlide === 3" key="s3" class="w-full max-w-md">
              <p
                class="text-center font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em] text-g-300 transition-all delay-100 duration-700"
                :class="vis ? 'opacity-100' : 'opacity-0'"
              >
                Artistes
              </p>
              <div class="mt-8 space-y-5">
                <div
                  v-for="(a, i) in stats.topArtists"
                  :key="a.name"
                  class="flex items-center gap-4 transition-all duration-500"
                  :class="vis ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'"
                  :style="{ transitionDelay: `${300 + i * 120}ms` }"
                >
                  <span
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-mono)] text-sm font-bold"
                    :class="i === 0 ? 'bg-g-white text-g-black' : 'border border-g-700 text-g-500'"
                  >{{ i + 1 }}</span>
                  <div class="min-w-0">
                    <p class="truncate font-semibold text-g-white">{{ a.name }}</p>
                    <p class="font-[family-name:var(--font-mono)] text-[11px] text-g-600">{{ a.count }} vinyle{{ a.count > 1 ? 's' : '' }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4 — Pièce rare -->
            <div v-else-if="currentSlide === 4" key="s4" class="flex w-full max-w-xs flex-col items-center">
              <p
                class="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em] text-g-300 transition-all delay-100 duration-700"
                :class="vis ? 'opacity-100' : 'opacity-0'"
              >
                Pièce rare
              </p>
              <div v-if="stats.rarestVinyl" class="mt-6 flex flex-col items-center">
                <div
                  class="overflow-hidden rounded-lg transition-all delay-200 duration-700"
                  :class="vis ? 'scale-100 opacity-100' : 'scale-90 opacity-0'"
                >
                  <img
                    v-if="stats.rarestVinyl.cover"
                    :src="stats.rarestVinyl.cover"
                    :alt="stats.rarestVinyl.title"
                    class="h-44 w-44 object-cover sm:h-52 sm:w-52"
                    decoding="async"
                  >
                  <div v-else class="flex h-44 w-44 items-center justify-center bg-g-800">
                    <UIcon name="i-lucide-disc-3" class="h-12 w-12 text-g-600" />
                  </div>
                </div>
                <p
                  class="mt-4 text-center font-semibold text-g-white transition-all delay-400 duration-700"
                  :class="vis ? 'opacity-100' : 'opacity-0'"
                >
                  {{ stats.rarestVinyl.title }}
                </p>
                <p
                  class="mt-1 text-sm text-g-500 transition-all delay-500 duration-700"
                  :class="vis ? 'opacity-100' : 'opacity-0'"
                >
                  {{ stats.rarestVinyl.artist }}
                </p>
                <div
                  class="mt-4 flex gap-8 transition-all delay-600 duration-700"
                  :class="vis ? 'opacity-100' : 'opacity-0'"
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

            <!-- 5 — Récap -->
            <div v-else key="s5" class="flex w-full max-w-sm flex-col items-center">
              <div
                class="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-g-700 transition-all delay-100 duration-700"
                :class="vis ? 'scale-100 opacity-100' : 'scale-50 opacity-0'"
              >
                <UIcon name="i-lucide-disc-3" class="h-6 w-6 text-g-white" />
              </div>
              <h2
                class="text-center text-2xl font-bold text-g-white transition-all delay-200 duration-700 sm:text-3xl"
                :class="vis ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'"
              >
                Votre collection,<br>votre identité.
              </h2>
              <div
                class="mt-6 flex flex-wrap justify-center gap-2 transition-all delay-400 duration-700"
                :class="vis ? 'opacity-100' : 'opacity-0'"
              >
                <span class="rounded-full border border-g-700 px-4 py-1.5 font-[family-name:var(--font-mono)] text-sm text-g-400">
                  {{ stats.totalVinyls }} vinyles
                </span>
                <span class="rounded-full border border-g-700 px-4 py-1.5 font-[family-name:var(--font-mono)] text-sm text-g-400">
                  {{ stats.totalCountries }} pays
                </span>
                <span class="rounded-full border border-g-700 px-4 py-1.5 font-[family-name:var(--font-mono)] text-sm text-g-400">
                  {{ stats.topGenres.length }} genres
                </span>
              </div>
              <UButton
                size="lg"
                class="mt-8 cursor-pointer rounded-full bg-g-white px-10 py-3 text-sm font-semibold text-g-black transition-all delay-600 duration-700 hover:bg-g-200"
                :class="vis ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'"
                @click="close"
              >
                Fermer
              </UButton>
            </div>
          </Transition>
        </div>

        <!-- Bottom nav -->
        <div class="flex shrink-0 items-center justify-between px-6 pb-6">
          <button
            class="flex cursor-pointer items-center gap-1 text-sm text-g-600 transition-colors hover:text-g-white disabled:cursor-default disabled:opacity-0"
            :disabled="currentSlide <= 0"
            @click="go(-1)"
          >
            <UIcon name="i-lucide-chevron-left" class="h-4 w-4" />
          </button>
          <img :src="logoBlanc" alt="GROOV" class="h-3.5 opacity-20">
          <button
            v-if="currentSlide < totalSlides - 1"
            class="flex cursor-pointer items-center gap-1 text-sm text-g-white transition-colors hover:text-g-300"
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
