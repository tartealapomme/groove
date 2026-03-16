import type { Database } from '~/database.types'

export interface UserPrefs {
  genres: string[]
  artists: string[]
  onboardingCompleted: boolean
}

const defaultPrefs: UserPrefs = {
  genres: [],
  artists: [],
  onboardingCompleted: false,
}

const prefs = ref<UserPrefs>({ ...defaultPrefs })
const _loaded = ref(false)

export function useUserPrefs() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const userId = computed(() => user.value?.id ?? null)

  async function load() {
    if (!userId.value) {
      prefs.value = { ...defaultPrefs }
      _loaded.value = false
      return
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId.value)
      .single()

    if (error || !data) {
      // Fallback: try localStorage for migration
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('groov_prefs')
          if (raw) {
            const parsed = JSON.parse(raw)
            prefs.value = {
              genres: Array.isArray(parsed.genres) ? parsed.genres : [],
              artists: Array.isArray(parsed.artists) ? parsed.artists : [],
              onboardingCompleted: (parsed.genres?.length > 0 || parsed.artists?.length > 0),
            }
            // Migrate to Supabase
            await save(prefs.value)
            localStorage.removeItem('groov_prefs')
            _loaded.value = true
            return
          }
        }
        catch { /* ignore parse errors */ }
      }
      prefs.value = { ...defaultPrefs }
      _loaded.value = true
      return
    }

    prefs.value = {
      genres: data.genres ?? [],
      artists: data.artists ?? [],
      onboardingCompleted: data.onboarding_completed ?? false,
    }
    _loaded.value = true
  }

  async function save(newPrefs: Partial<UserPrefs>) {
    prefs.value = {
      genres: newPrefs.genres ?? prefs.value.genres,
      artists: newPrefs.artists ?? prefs.value.artists,
      onboardingCompleted: newPrefs.onboardingCompleted ?? prefs.value.onboardingCompleted,
    }

    if (!userId.value) return

    await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId.value,
        genres: prefs.value.genres,
        artists: prefs.value.artists,
        onboarding_completed: prefs.value.onboardingCompleted,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
  }

  async function ensureLoaded() {
    if (!_loaded.value && userId.value) await load()
  }

  return { prefs, load, save, ensureLoaded }
}
