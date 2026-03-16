import type { Database } from '~/database.types'

type CollectionRow = Database['public']['Tables']['user_collection']['Row']
type CollectionInsert = Database['public']['Tables']['user_collection']['Insert']

export interface CollectionVinylInput {
  discogs_id: number
  title?: string | null
  artist?: string | null
  year?: string | null
  label?: string | null
  genre?: string[]
  thumb?: string | null
  cover?: string | null
  condition?: string | null
  notes?: string | null
}

export function useUserCollection() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const collection = ref<CollectionRow[]>([])

  const userId = computed(() => {
    const u = user.value as any
    return u?.id ?? u?.sub ?? null
  })

  async function fetchCollection() {
    if (!userId.value) {
      collection.value = []
      return
    }
    const { data, error } = await supabase
      .from('user_collection')
      .select('*')
      .eq('user_id', userId.value)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur fetch collection:', error)
      collection.value = []
      return
    }
    collection.value = data ?? []
  }

  async function addToCollection(input: CollectionVinylInput) {
    if (!userId.value) return { error: new Error('Utilisateur non connecté') }

    const row: CollectionInsert = {
      user_id: userId.value,
      discogs_id: input.discogs_id,
      title: input.title ?? null,
      artist: input.artist ?? null,
      year: input.year ?? null,
      label: input.label ?? null,
      genre: input.genre ?? [],
      thumb: input.thumb ?? null,
      cover: input.cover ?? null,
      condition: input.condition ?? null,
      notes: input.notes ?? null,
    }

    const { error } = await supabase.from('user_collection').insert(row)

    if (error) {
      if (error.code === '23505') {
        // Doublon (unique violation)
        return { error: new Error('Ce vinyle est déjà dans ta collection') }
      }
      return { error }
    }

    await fetchCollection()
    return { error: null }
  }

  async function removeFromCollection(discogsId: number) {
    if (!userId.value) return { error: new Error('Utilisateur non connecté') }

    const { error } = await supabase
      .from('user_collection')
      .delete()
      .eq('user_id', userId.value)
      .eq('discogs_id', discogsId)

    if (error) return { error }
    await fetchCollection()
    return { error: null }
  }

  function isInCollection(discogsId: number): boolean {
    return collection.value.some(c => c.discogs_id === discogsId)
  }

  return {
    collection,
    fetchCollection,
    addToCollection,
    removeFromCollection,
    isInCollection,
  }
}
