const showOnboarding = ref(false)
const onboardingStep = ref<'genres' | 'artists' | 'confirm'>('genres')
const selectedGenres = ref<string[]>([])
const selectedArtists = ref<string[]>([])
let onFinishCallback: (() => void) | null = null

export function useOnboarding() {
  const { save } = useUserPrefs()

  function start(options?: { onFinish?: () => void; initialGenres?: string[]; initialArtists?: string[] }) {
    onFinishCallback = options?.onFinish ?? null
    onboardingStep.value = 'genres'
    selectedGenres.value = options?.initialGenres ? [...options.initialGenres] : []
    selectedArtists.value = options?.initialArtists ? [...options.initialArtists] : []
    showOnboarding.value = true
  }

  function close() {
    showOnboarding.value = false
  }

  function toggleGenre(genre: string) {
    const idx = selectedGenres.value.indexOf(genre)
    if (idx >= 0) {
      selectedGenres.value.splice(idx, 1)
    }
    else if (selectedGenres.value.length < 5) {
      selectedGenres.value.push(genre)
    }
  }

  function toggleArtist(artist: string) {
    const idx = selectedArtists.value.indexOf(artist)
    if (idx >= 0) {
      selectedArtists.value.splice(idx, 1)
    }
    else if (selectedArtists.value.length < 5) {
      selectedArtists.value.push(artist)
    }
  }

  function goToArtists() {
    onboardingStep.value = 'artists'
  }

  function goToConfirm() {
    onboardingStep.value = 'confirm'
  }

  async function finish() {
    await save({
      genres: selectedGenres.value,
      artists: selectedArtists.value,
      onboardingCompleted: true,
    })
    showOnboarding.value = false
    onFinishCallback?.()
    onFinishCallback = null
  }

  return {
    showOnboarding,
    onboardingStep,
    selectedGenres,
    selectedArtists,
    start,
    close,
    toggleGenre,
    toggleArtist,
    goToArtists,
    goToConfirm,
    finish,
  }
}
