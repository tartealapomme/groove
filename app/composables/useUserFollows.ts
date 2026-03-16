import type { Database } from '~/database.types'

export function useUserFollows() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  async function getFollowers(userId: string) {
    const { data, error } = await supabase
      .from('user_follows')
      .select('follower_id, profiles!user_follows_follower_id_fkey(display_name, avatar_url, email)')
      .eq('following_id', userId)

    if (error) return []
    return data ?? []
  }

  async function getFollowing(userId: string) {
    const { data, error } = await supabase
      .from('user_follows')
      .select('following_id, profiles!user_follows_following_id_fkey(display_name, avatar_url, email)')
      .eq('follower_id', userId)

    if (error) return []
    return data ?? []
  }

  async function getFollowCounts(userId: string) {
    const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
      supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
    ])
    return {
      followers: followersCount ?? 0,
      following: followingCount ?? 0,
    }
  }

  async function isFollowing(targetUserId: string): Promise<boolean> {
    if (!user.value?.id || user.value.id === targetUserId) return false

    const { data } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', user.value.id)
      .eq('following_id', targetUserId)
      .single()

    return !!data
  }

  async function follow(targetUserId: string) {
    if (!user.value?.id) return { error: new Error('Non connecté') }
    if (user.value.id === targetUserId) return { error: new Error('Impossible de se follow soi-même') }

    const { error } = await supabase
      .from('user_follows')
      .insert({ follower_id: user.value.id, following_id: targetUserId })

    return { error }
  }

  async function unfollow(targetUserId: string) {
    if (!user.value?.id) return { error: new Error('Non connecté') }

    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', user.value.id)
      .eq('following_id', targetUserId)

    return { error }
  }

  return {
    getFollowers,
    getFollowing,
    getFollowCounts,
    isFollowing,
    follow,
    unfollow,
  }
}
