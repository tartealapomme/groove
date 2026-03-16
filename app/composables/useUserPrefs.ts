const STORAGE_KEY = 'groov_prefs'

export interface UserPrefs {
  genres: string[]
  artists: string[]
}

const defaultPrefs: UserPrefs = {
  genres: [],
  artists: [],
}

export function useUserPrefs() {
  const prefs = ref<UserPrefs>(defaultPrefs)

  function load() {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as UserPrefs
        prefs.value = {
          genres: Array.isArray(parsed.genres) ? parsed.genres : [],
          artists: Array.isArray(parsed.artists) ? parsed.artists : [],
        }
      }
    }
    catch {
      prefs.value = { ...defaultPrefs }
    }
  }

  function save(newPrefs: Partial<UserPrefs>) {
    prefs.value = {
      genres: newPrefs.genres ?? prefs.value.genres,
      artists: newPrefs.artists ?? prefs.value.artists,
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs.value))
    }
  }

  onMounted(load)

  return { prefs, load, save }
}
