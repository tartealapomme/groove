<script lang="ts" setup>
import logoBlanc from '~/assets/img/groov_logo_blanc.svg'

const {
  showOnboarding,
  onboardingStep,
  selectedGenres,
  selectedArtists,
  toggleGenre,
  toggleArtist,
  goToArtists,
  goToConfirm,
  finish,
} = useOnboarding()

const { searchReleases } = useDiscogs()

const genres = [
  { id: 'Rock', label: 'Rock' },
  { id: 'Jazz', label: 'Jazz' },
  { id: 'Electronic', label: 'Electronic' },
  { id: 'Funk / Soul', label: 'Soul / Funk' },
  { id: 'Hip Hop', label: 'Hip Hop' },
  { id: 'Classical', label: 'Classical' },
  { id: 'Pop', label: 'Pop' },
  { id: 'Reggae', label: 'Reggae' },
  { id: 'Blues', label: 'Blues' },
  { id: 'Latin', label: 'Latin' },
  { id: 'Folk, World, & Country', label: 'Folk / Country' },
  { id: 'Stage & Screen', label: 'Stage & Screen' },
]

const genreLabels: Record<string, string> = Object.fromEntries(genres.map(g => [g.id, g.label]))

interface ArtistItem {
  name: string
  thumb: string
}

const suggestedArtists = ref<ArtistItem[]>([])
const isLoadingArtists = ref(false)

async function loadArtists() {
  if (!selectedGenres.value.length) return
  isLoadingArtists.value = true
  try {
    const allArtists = new Map<string, ArtistItem>()
    const fetches = selectedGenres.value.map(g =>
      searchReleases({ genre: g, per_page: 20, sort: 'want', sort_order: 'desc' }),
    )
    const results = await Promise.all(fetches)

    for (const res of results) {
      for (const r of res.results) {
        const name = r.title.includes(' - ') ? r.title.split(' - ')[0]?.trim() : ''
        if (!name || allArtists.has(name)) continue
        allArtists.set(name, { name, thumb: r.thumb || '' })
      }
    }

    suggestedArtists.value = [...allArtists.values()].slice(0, 12)
  }
  catch {
    suggestedArtists.value = []
  }
  finally {
    isLoadingArtists.value = false
  }
}

function onNextToArtists() {
  goToArtists()
  loadArtists()
}

// Artist search
const artistQuery = ref('')
const artistSearchResults = ref<ArtistItem[]>([])
const isSearchingArtists = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

function onArtistSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  const q = artistQuery.value.trim()
  if (q.length < 2) {
    artistSearchResults.value = []
    return
  }
  isSearchingArtists.value = true
  searchTimeout = setTimeout(async () => {
    try {
      const res = await searchReleases({ q, per_page: 12 })
      const found = new Map<string, ArtistItem>()
      for (const r of res.results) {
        const name = r.title.includes(' - ') ? r.title.split(' - ')[0]?.trim() : ''
        if (!name || found.has(name) || selectedArtists.value.includes(name)) continue
        found.set(name, { name, thumb: r.thumb || '' })
      }
      artistSearchResults.value = [...found.values()].slice(0, 8)
    }
    catch {
      artistSearchResults.value = []
    }
    finally {
      isSearchingArtists.value = false
    }
  }, 350)
}

function selectSearchArtist(artist: ArtistItem) {
  toggleArtist(artist.name)
  artistQuery.value = ''
  artistSearchResults.value = []
}

const showConfirmAnim = ref(false)
watch(() => onboardingStep.value, (step) => {
  if (step === 'confirm') {
    showConfirmAnim.value = false
    setTimeout(() => { showConfirmAnim.value = true }, 100)
  }
})
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
        v-if="showOnboarding"
        class="fixed inset-0 z-[100] flex flex-col bg-g-black"
      >
        <div class="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-12">
          <Transition
            enter-active-class="transition duration-400 ease-out"
            enter-from-class="translate-y-4 opacity-0"
            enter-to-class="translate-y-0 opacity-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="translate-y-0 opacity-100"
            leave-to-class="-translate-y-4 opacity-0"
            mode="out-in"
          >
            <!-- ── STEP 1 : GENRES ── -->
            <div
              v-if="onboardingStep === 'genres'"
              key="genres"
              class="flex w-full max-w-xl flex-col items-center"
            >
              <span class="mb-6 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.2em] text-g-500">
                Étape 1 sur 3
              </span>

              <h1 class="text-center text-3xl font-bold tracking-tight text-g-white sm:text-4xl">
                Quels genres vous<br>font vibrer ?
              </h1>
              <p class="mt-3 text-center text-sm text-g-400">
                Sélectionnez jusqu'à <span class="text-g-white">5 genres</span> pour personnaliser votre feed.
              </p>

              <div class="mt-10 flex flex-wrap justify-center gap-3">
                <button
                  v-for="genre in genres"
                  :key="genre.id"
                  class="cursor-pointer rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-200"
                  :class="selectedGenres.includes(genre.id)
                    ? 'border-g-white bg-g-white text-g-black shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                    : selectedGenres.length >= 5
                      ? 'border-g-800 text-g-600 opacity-50'
                      : 'border-g-600 text-g-300 hover:border-g-300 hover:text-g-white'"
                  @click="toggleGenre(genre.id)"
                >
                  {{ genre.label }}
                </button>
              </div>

              <div class="mt-10 flex flex-col items-center gap-4">
                <div class="flex items-center gap-2">
                  <div
                    v-for="i in 5"
                    :key="i"
                    class="h-1.5 w-6 rounded-full transition-colors duration-200"
                    :class="i <= selectedGenres.length ? 'bg-g-white' : 'bg-g-700'"
                  />
                </div>
                <UButton
                  size="lg"
                  class="cursor-pointer rounded-full bg-g-white px-10 py-3 text-sm font-semibold text-g-black transition-all hover:bg-g-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] disabled:cursor-not-allowed disabled:opacity-20"
                  :disabled="selectedGenres.length < 1"
                  @click="onNextToArtists"
                >
                  Continuer
                </UButton>
              </div>
            </div>

            <!-- ── STEP 2 : ARTISTS ── -->
            <div
              v-else-if="onboardingStep === 'artists'"
              key="artists"
              class="flex w-full max-w-2xl flex-col items-center"
            >
              <span class="mb-6 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.2em] text-g-500">
                Étape 2 sur 3
              </span>

              <h1 class="text-center text-3xl font-bold tracking-tight text-g-white sm:text-4xl">
                Des artistes<br>que vous aimez ?
              </h1>
              <p class="mt-3 text-center text-sm text-g-400">
                Choisissez jusqu'à <span class="text-g-white">5 artistes</span> parmi les suggestions ou cherchez les vôtres.
              </p>

              <!-- Selected artists pills -->
              <div v-if="selectedArtists.length" class="mt-6 flex flex-wrap justify-center gap-2">
                <span
                  v-for="name in selectedArtists"
                  :key="name"
                  class="flex cursor-pointer items-center gap-1.5 rounded-full bg-g-white px-4 py-1.5 text-sm font-medium text-g-black shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all hover:bg-g-200"
                  @click="toggleArtist(name)"
                >
                  {{ name }}
                  <UIcon name="i-lucide-x" class="h-3.5 w-3.5" />
                </span>
              </div>

              <!-- Loading -->
              <div v-if="isLoadingArtists" class="mt-12 flex flex-col items-center gap-3">
                <UIcon name="i-lucide-loader-2" class="h-6 w-6 animate-spin text-g-500" />
                <p class="text-xs text-g-500">Chargement des artistes…</p>
              </div>

              <template v-else>
                <!-- Suggested artist bubbles -->
                <div class="mt-8 flex flex-wrap justify-center gap-3">
                  <button
                    v-for="artist in suggestedArtists.filter(a => !selectedArtists.includes(a.name))"
                    :key="artist.name"
                    class="group flex cursor-pointer items-center gap-2.5 rounded-full border py-2 pl-2 pr-5 transition-all duration-200"
                    :class="selectedArtists.length >= 5
                      ? 'border-g-800 text-g-600 opacity-50'
                      : 'border-g-600 text-g-300 hover:border-g-300 hover:text-g-white'"
                    :disabled="selectedArtists.length >= 5"
                    @click="toggleArtist(artist.name)"
                  >
                    <div class="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-g-700">
                      <img
                        v-if="artist.thumb"
                        :src="artist.thumb"
                        :alt="artist.name"
                        class="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      >
                    </div>
                    <span class="text-sm font-medium">{{ artist.name }}</span>
                  </button>
                </div>

                <!-- Search bar for "Autre" -->
                <div class="mt-6 w-full max-w-sm">
                  <div class="relative">
                    <div
                      class="flex items-center rounded-full border px-4 py-2.5 transition-colors"
                      :class="artistQuery
                        ? 'border-g-400 bg-g-800'
                        : 'border-g-700 bg-g-900 focus-within:border-g-500 focus-within:bg-g-800'"
                    >
                      <UIcon name="i-lucide-search" class="mr-2.5 h-4 w-4 shrink-0 text-g-500" />
                      <input
                        v-model="artistQuery"
                        type="text"
                        placeholder="Chercher un autre artiste…"
                        class="w-full bg-transparent text-sm text-g-white outline-none placeholder:text-g-500"
                        @input="onArtistSearch"
                      >
                      <UIcon
                        v-if="isSearchingArtists"
                        name="i-lucide-loader-2"
                        class="ml-2 h-4 w-4 shrink-0 animate-spin text-g-500"
                      />
                    </div>

                    <!-- Search results dropdown -->
                    <Transition
                      enter-active-class="transition duration-150 ease-out"
                      enter-from-class="scale-95 opacity-0"
                      enter-to-class="scale-100 opacity-100"
                      leave-active-class="transition duration-100 ease-in"
                      leave-from-class="opacity-100"
                      leave-to-class="opacity-0"
                    >
                      <div
                        v-if="artistSearchResults.length"
                        class="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-lg border border-g-700 bg-g-900 shadow-xl"
                      >
                        <button
                          v-for="result in artistSearchResults"
                          :key="result.name"
                          class="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-g-800"
                          :class="selectedArtists.length >= 5 ? 'opacity-50' : ''"
                          :disabled="selectedArtists.length >= 5"
                          @click="selectSearchArtist(result)"
                        >
                          <div class="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-g-700">
                            <img
                              v-if="result.thumb"
                              :src="result.thumb"
                              :alt="result.name"
                              class="h-full w-full object-cover"
                            >
                          </div>
                          <span class="truncate text-sm text-g-300">{{ result.name }}</span>
                        </button>
                      </div>
                    </Transition>
                  </div>
                </div>
              </template>

              <!-- Counter + CTA -->
              <div class="mt-10 flex flex-col items-center gap-4">
                <div class="flex items-center gap-2">
                  <div
                    v-for="i in 5"
                    :key="i"
                    class="h-1.5 w-6 rounded-full transition-colors duration-200"
                    :class="i <= selectedArtists.length ? 'bg-g-white' : 'bg-g-700'"
                  />
                </div>
                <div class="flex items-center gap-3">
                  <UButton
                    variant="ghost"
                    size="lg"
                    class="cursor-pointer rounded-full px-6 py-3 text-sm text-g-400 transition-colors hover:bg-g-800 hover:text-g-white"
                    @click="onboardingStep = 'genres'"
                  >
                    <UIcon name="i-lucide-arrow-left" class="mr-1.5 h-4 w-4" />
                    Retour
                  </UButton>
                  <UButton
                    size="lg"
                    class="cursor-pointer rounded-full bg-g-white px-10 py-3 text-sm font-semibold text-g-black transition-all hover:bg-g-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] disabled:cursor-not-allowed disabled:opacity-20"
                    :disabled="selectedArtists.length < 1"
                    @click="goToConfirm"
                  >
                    Continuer
                  </UButton>
                </div>
              </div>
            </div>

            <!-- ── STEP 3 : CONFIRMATION ── -->
            <div
              v-else
              key="confirm"
              class="flex w-full max-w-md flex-col items-center"
            >
              <div
                class="mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-g-700 transition-all duration-700"
                :class="showConfirmAnim ? 'scale-100 opacity-100' : 'scale-50 opacity-0'"
              >
                <UIcon name="i-lucide-check" class="h-7 w-7 text-g-white" />
              </div>

              <h1
                class="text-center text-3xl font-bold tracking-tight text-g-white transition-all delay-200 duration-700 sm:text-4xl"
                :class="showConfirmAnim ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'"
              >
                Votre profil est prêt
              </h1>
              <p
                class="mt-3 text-center text-sm text-g-400 transition-all delay-300 duration-700"
                :class="showConfirmAnim ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'"
              >
                Vos recommandations seront basées sur vos goûts.
              </p>

              <!-- Recap -->
              <div
                class="mt-10 w-full space-y-6 transition-all delay-400 duration-700"
                :class="showConfirmAnim ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'"
              >
                <!-- Genres -->
                <div>
                  <p class="mb-3 text-center font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-g-500">
                    Genres
                  </p>
                  <div class="flex flex-wrap justify-center gap-2">
                    <span
                      v-for="g in selectedGenres"
                      :key="g"
                      class="rounded-full border border-g-600 px-4 py-1.5 text-sm text-g-300"
                    >
                      {{ genreLabels[g] || g }}
                    </span>
                  </div>
                </div>

                <!-- Artists -->
                <div>
                  <p class="mb-3 text-center font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-g-500">
                    Artistes
                  </p>
                  <div class="flex flex-wrap justify-center gap-2">
                    <span
                      v-for="a in selectedArtists"
                      :key="a"
                      class="rounded-full border border-g-600 px-4 py-1.5 text-sm text-g-300"
                    >
                      {{ a }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- CTA -->
              <div
                class="mt-10 flex flex-col items-center gap-3 transition-all delay-500 duration-700"
                :class="showConfirmAnim ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'"
              >
                <UButton
                  size="lg"
                  class="cursor-pointer rounded-full bg-g-white px-12 py-3 text-sm font-semibold text-g-black transition-all hover:bg-g-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                  @click="finish"
                >
                  Explorer GROOV
                </UButton>
                <button
                  class="cursor-pointer text-xs text-g-500 transition-colors hover:text-g-300"
                  @click="onboardingStep = 'artists'"
                >
                  Modifier mes choix
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Logo bottom center -->
        <div class="flex shrink-0 justify-center pb-8">
          <img :src="logoBlanc" alt="GROOV" class="h-4 opacity-25">
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
