import type { Database } from '~/database.types'

type FavoriteRow = Database['public']['Tables']['user_favorites']['Row']
type FavoriteInsert = Database['public']['Tables']['user_favorites']['Insert']

export interface FavoriteVinylInput {
  discogs_id: number
  title?: string | null
  artist?: string | null
  thumb?: string | null
  cover?: string | null
}

const favorites = ref<FavoriteRow[]>([])
const _fetched = ref(false)

export function useUserFavorites() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const userId = computed(() => user.value?.id ?? null)

  async function fetchFavorites() {
    let uid = userId.value
    if (!uid) {
      const { data: { session } } = await supabase.auth.getSession()
      uid = session?.user?.id ?? null
    }
    if (!uid) {
      favorites.value = []
      _fetched.value = false
      return
    }
    const { data, error } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur fetch favoris:', error)
      favorites.value = []
      return
    }
    favorites.value = data ?? []
    _fetched.value = true
  }

  async function ensureLoaded() {
    if (!_fetched.value) await fetchFavorites()
  }

  async function addFavorite(input: FavoriteVinylInput) {
    let uid = userId.value
    if (!uid) {
      const { data: { session } } = await supabase.auth.getSession()
      uid = session?.user?.id ?? null
    }
    if (!uid) return { error: new Error('Utilisateur non connecté') }

    const row: FavoriteInsert = {
      user_id: uid,
      discogs_id: input.discogs_id,
      title: input.title ?? null,
      artist: input.artist ?? null,
      thumb: input.thumb ?? null,
      cover: input.cover ?? null,
    }

    const { error } = await supabase.from('user_favorites').insert(row)

    if (error) {
      if (error.code === '23505') {
        return { error: new Error('Ce vinyle est déjà dans tes favoris') }
      }
      return { error }
    }

    await fetchFavorites()
    return { error: null }
  }

  async function removeFavorite(discogsId: number) {
    let uid = userId.value
    if (!uid) {
      const { data: { session } } = await supabase.auth.getSession()
      uid = session?.user?.id ?? null
    }
    if (!uid) return { error: new Error('Utilisateur non connecté') }

    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', uid)
      .eq('discogs_id', discogsId)

    if (error) return { error }
    await fetchFavorites()
    return { error: null }
  }

  function isFavorite(discogsId: number): boolean {
    return favorites.value.some(f => f.discogs_id === discogsId)
  }

  function reset() {
    favorites.value = []
    _fetched.value = false
  }

  return {
    favorites,
    fetchFavorites,
    ensureLoaded,
    addFavorite,
    removeFavorite,
    isFavorite,
    reset,
  }
}
