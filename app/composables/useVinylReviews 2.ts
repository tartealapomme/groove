import type { Database } from '~/database.types'

type ReviewRow = Database['public']['Tables']['vinyl_reviews']['Row']

export interface ReviewWithProfile extends ReviewRow {
  profiles?: {
    display_name: string | null
    username: string | null
    avatar_url: string | null
    email: string | null
  } | null
}

export function useVinylReviews() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  async function getReviewsForVinyl(discogsId: number): Promise<ReviewWithProfile[]> {
    const { data, error } = await supabase
      .from('vinyl_reviews')
      .select('*, profiles(display_name, username, avatar_url, email)')
      .eq('discogs_id', discogsId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reviews:', error)
      return []
    }
    return (data as ReviewWithProfile[]) ?? []
  }

  async function getUserReview(discogsId: number): Promise<ReviewRow | null> {
    let uid = user.value?.id
    if (!uid) {
      const { data: { session } } = await supabase.auth.getSession()
      uid = session?.user?.id ?? null
    }
    if (!uid) return null

    const { data } = await supabase
      .from('vinyl_reviews')
      .select('*')
      .eq('discogs_id', discogsId)
      .eq('user_id', uid)
      .single()

    return data
  }

  async function submitReview(
    discogsId: number,
    rating: number,
    title?: string,
    body?: string,
    vinylInfo?: { title?: string; artist?: string; thumb?: string },
  ) {
    let uid = user.value?.id
    if (!uid) {
      const { data: { session } } = await supabase.auth.getSession()
      uid = session?.user?.id ?? null
    }
    if (!uid) return { error: new Error('Non connecté') }

    const { error } = await supabase
      .from('vinyl_reviews')
      .upsert(
        {
          user_id: uid,
          discogs_id: discogsId,
          rating,
          title: title || null,
          body: body || null,
          vinyl_title: vinylInfo?.title ?? null,
          vinyl_artist: vinylInfo?.artist ?? null,
          vinyl_thumb: vinylInfo?.thumb ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,discogs_id' },
      )

    return { error: error ? new Error(error.message) : null }
  }

  async function deleteReview(discogsId: number) {
    let uid = user.value?.id
    if (!uid) {
      const { data: { session } } = await supabase.auth.getSession()
      uid = session?.user?.id ?? null
    }
    if (!uid) return { error: new Error('Non connecté') }

    const { error } = await supabase
      .from('vinyl_reviews')
      .delete()
      .eq('discogs_id', discogsId)
      .eq('user_id', uid)

    return { error }
  }

  async function getUserReviews(userId: string) {
    const { data, error } = await supabase
      .from('vinyl_reviews')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user reviews:', error)
      return []
    }
    return (data as ReviewRow[]) ?? []
  }

  function getAverageRating(reviews: ReviewRow[]): number {
    if (!reviews.length) return 0
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    return Math.round((sum / reviews.length) * 10) / 10
  }

  return {
    getReviewsForVinyl,
    getUserReviews,
    getUserReview,
    submitReview,
    deleteReview,
    getAverageRating,
  }
}
