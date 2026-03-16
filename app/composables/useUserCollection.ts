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
  estimated_price?: number | null
}

const collection = ref<CollectionRow[]>([])
const _fetched = ref(false)

export function useUserCollection() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const userId = computed(() => user.value?.id ?? null)

  async function fetchCollection() {
    let uid = userId.value
    if (!uid) {
      const { data: { session } } = await supabase.auth.getSession()
      uid = session?.user?.id ?? null
    }
    if (!uid) {
      collection.value = []
      _fetched.value = false
      return
    }
    const { data, error } = await supabase
      .from('user_collection')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur fetch collection:', error)
      collection.value = []
      return
    }
    collection.value = data ?? []
    _fetched.value = true
  }

  async function ensureLoaded() {
    if (!_fetched.value) await fetchCollection()
  }

  async function addToCollection(input: CollectionVinylInput) {
    let uid = userId.value
    if (!uid) {
      const { data: { session } } = await supabase.auth.getSession()
      uid = session?.user?.id ?? null
    }
    if (!uid) return { error: new Error('Utilisateur non connecté') }

    const row: CollectionInsert = {
      user_id: uid,
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
      estimated_price: input.estimated_price ?? null,
    }

    const { error } = await supabase.from('user_collection').insert(row)

    if (error) {
      if (error.code === '23505') {
        return { error: new Error('Ce vinyle est déjà dans ta collection') }
      }
      return { error }
    }

    await fetchCollection()
    return { error: null }
  }

  async function removeFromCollection(discogsId: number) {
    let uid = userId.value
    if (!uid) {
      const { data: { session } } = await supabase.auth.getSession()
      uid = session?.user?.id ?? null
    }
    if (!uid) return { error: new Error('Utilisateur non connecté') }

    const { error } = await supabase
      .from('user_collection')
      .delete()
      .eq('user_id', uid)
      .eq('discogs_id', discogsId)

    if (error) return { error }
    await fetchCollection()
    return { error: null }
  }

  function isInCollection(discogsId: number): boolean {
    return collection.value.some(c => c.discogs_id === discogsId)
  }

  function reset() {
    collection.value = []
    _fetched.value = false
  }

  return {
    collection,
    fetchCollection,
    ensureLoaded,
    addToCollection,
    removeFromCollection,
    isInCollection,
    reset,
  }
}
