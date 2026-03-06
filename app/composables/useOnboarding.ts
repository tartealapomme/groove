const showOnboarding = ref(false)
const onboardingStep = ref<'genres' | 'artists' | 'confirm'>('genres')
const selectedGenres = ref<string[]>([])
const selectedArtists = ref<string[]>([])

export function useOnboarding() {
  function start() {
    onboardingStep.value = 'genres'
    selectedGenres.value = []
    selectedArtists.value = []
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

  function finish() {
    localStorage.setItem('groov_prefs', JSON.stringify({
      genres: selectedGenres.value,
      artists: selectedArtists.value,
    }))
    showOnboarding.value = false
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
