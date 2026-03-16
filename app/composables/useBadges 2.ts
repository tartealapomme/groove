import type { Database } from '~/database.types'

export interface BadgeDefinition {
  key: string
  name: string
  description: string
  icon: string
  color: string
  check: (ctx: BadgeContext) => boolean
}

export interface BadgeContext {
  collectionCount: number
  wishlistCount: number
  genreCount: number
  artistCount: number
  labelCount: number
  reviewCount: number
  followerCount: number
  followingCount: number
  genres: string[]
}

export interface UnlockedBadge extends BadgeDefinition {
  unlocked_at: string
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    key: 'first_vinyl',
    name: 'Premier Sillon',
    description: 'Ajouter votre premier vinyle à la collection',
    icon: 'i-lucide-disc-3',
    color: 'text-amber-500',
    check: ctx => ctx.collectionCount >= 1,
  },
  {
    key: 'collector_10',
    name: 'Collectionneur',
    description: 'Atteindre 10 vinyles dans la collection',
    icon: 'i-lucide-library-big',
    color: 'text-blue-500',
    check: ctx => ctx.collectionCount >= 10,
  },
  {
    key: 'collector_50',
    name: 'Vinyl Addict',
    description: 'Atteindre 50 vinyles dans la collection',
    icon: 'i-lucide-crown',
    color: 'text-purple-500',
    check: ctx => ctx.collectionCount >= 50,
  },
  {
    key: 'collector_100',
    name: 'Cratedigger',
    description: 'Atteindre 100 vinyles dans la collection',
    icon: 'i-lucide-gem',
    color: 'text-pink-500',
    check: ctx => ctx.collectionCount >= 100,
  },
  {
    key: 'genre_explorer',
    name: 'Explorateur',
    description: 'Collectionner des vinyles de 5 genres différents',
    icon: 'i-lucide-compass',
    color: 'text-emerald-500',
    check: ctx => ctx.genreCount >= 5,
  },
  {
    key: 'wishlist_5',
    name: 'Chasseur',
    description: 'Ajouter 5 vinyles à la wishlist',
    icon: 'i-lucide-heart',
    color: 'text-red-500',
    check: ctx => ctx.wishlistCount >= 5,
  },
  {
    key: 'first_review',
    name: 'Critique',
    description: 'Écrire votre première review',
    icon: 'i-lucide-message-square',
    color: 'text-sky-500',
    check: ctx => ctx.reviewCount >= 1,
  },
  {
    key: 'reviewer_10',
    name: 'Chroniqueur',
    description: 'Écrire 10 reviews',
    icon: 'i-lucide-pen-tool',
    color: 'text-indigo-500',
    check: ctx => ctx.reviewCount >= 10,
  },
  {
    key: 'social_butterfly',
    name: 'Social',
    description: 'Suivre 5 autres collectionneurs',
    icon: 'i-lucide-users',
    color: 'text-teal-500',
    check: ctx => ctx.followingCount >= 5,
  },
  {
    key: 'popular',
    name: 'Populaire',
    description: 'Être suivi par 10 personnes',
    icon: 'i-lucide-star',
    color: 'text-yellow-500',
    check: ctx => ctx.followerCount >= 10,
  },
  {
    key: 'jazz_lover',
    name: 'Jazz Head',
    description: 'Collectionner au moins 5 vinyles de Jazz',
    icon: 'i-lucide-music',
    color: 'text-orange-500',
    check: ctx => ctx.genres.filter(g => g === 'Jazz').length >= 5,
  },
  {
    key: 'rock_lover',
    name: 'Rocker',
    description: 'Collectionner au moins 5 vinyles de Rock',
    icon: 'i-lucide-guitar',
    color: 'text-red-600',
    check: ctx => ctx.genres.filter(g => g === 'Rock').length >= 5,
  },
]

export function useBadges() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  function getAllBadgeDefinitions(): BadgeDefinition[] {
    return BADGE_DEFINITIONS
  }

  async function getUserBadges(userId?: string): Promise<UnlockedBadge[]> {
    const targetId = userId || user.value?.id
    if (!targetId) return []

    const { data, error } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', targetId)

    if (error || !data) return []

    return data
      .map((row) => {
        const def = BADGE_DEFINITIONS.find(d => d.key === row.badge_key)
        if (!def) return null
        return { ...def, unlocked_at: row.unlocked_at }
      })
      .filter((b): b is UnlockedBadge => b !== null)
  }

  async function checkAndAwardBadges(context: BadgeContext) {
    // Récupère de façon robuste l'id utilisateur
    let uid = user.value?.id

    if (!uid) {
      const { data: { session } } = await supabase.auth.getSession()
      uid = session?.user?.id ?? null
    }

    if (!uid) return []

    const { data: existing } = await supabase
      .from('user_badges')
      .select('badge_key')
      .eq('user_id', uid)

    const existingKeys = new Set((existing ?? []).map(b => b.badge_key))
    const newBadges: BadgeDefinition[] = []

    for (const badge of BADGE_DEFINITIONS) {
      if (existingKeys.has(badge.key)) continue
      if (badge.check(context)) {
        const { error } = await supabase
          .from('user_badges')
          .insert({ user_id: uid, badge_key: badge.key })

        if (!error) newBadges.push(badge)
      }
    }

    return newBadges
  }

  return {
    getAllBadgeDefinitions,
    getUserBadges,
    checkAndAwardBadges,
  }
}
