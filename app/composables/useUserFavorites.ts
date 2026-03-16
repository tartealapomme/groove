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

export function useUserFavorites() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const favorites = ref<FavoriteRow[]>([])

  const userId = computed(() => {
    const u = user.value as any
    return u?.id ?? u?.sub ?? null
  })

  async function fetchFavorites() {
    if (!userId.value) {
      favorites.value = []
      return
    }
    const { data, error } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', userId.value)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur fetch favoris:', error)
      favorites.value = []
      return
    }
    favorites.value = data ?? []
  }

  async function addFavorite(input: FavoriteVinylInput) {
    if (!userId.value) return { error: new Error('Utilisateur non connecté') }

    const row: FavoriteInsert = {
      user_id: userId.value,
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
    if (!userId.value) return { error: new Error('Utilisateur non connecté') }

    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId.value)
      .eq('discogs_id', discogsId)

    if (error) return { error }
    await fetchFavorites()
    return { error: null }
  }

  function isFavorite(discogsId: number): boolean {
    return favorites.value.some(f => f.discogs_id === discogsId)
  }

  return {
    favorites,
    fetchFavorites,
    addFavorite,
    removeFavorite,
    isFavorite,
  }
}
