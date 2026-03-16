<script lang="ts" setup>
import type { Database } from '~/database.types'

const route = useRoute()
const supabase = useSupabaseClient<Database>()
const currentUser = useSupabaseUser()
const { getFollowCounts, isFollowing, follow, unfollow } = useUserFollows()
const { getUserBadges, getAllBadgeDefinitions } = useBadges()
const { getUserReviews } = useVinylReviews()
const { getRelease } = useDiscogs()

const slug = computed(() => route.params.id as string)
const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
const profileId = computed(() => profile.value?.id ?? null)
const isOwnProfile = computed(() => currentUser.value?.id === profile.value?.id)
const isFollowingUser = ref(false)
const followLoading = ref(false)

const genreLabels: Record<string, string> = {
  'Rock': 'Rock',
  'Jazz': 'Jazz',
  'Electronic': 'Electronic',
  'Funk / Soul': 'Soul / Funk',
  'Hip Hop': 'Hip Hop',
  'Classical': 'Classique',
  'Pop': 'Pop',
  'Reggae': 'Reggae',
  'Blues': 'Blues',
  'Latin': 'Latin',
  'Folk, World, & Country': 'Folk / Country',
  'Stage & Screen': 'Stage & Screen',
}

const profile = ref<Database['public']['Tables']['profiles']['Row'] | null>(null)
const collection = ref<Database['public']['Tables']['user_collection']['Row'][]>([])
const favorites = ref<Database['public']['Tables']['user_favorites']['Row'][]>([])
const followCounts = ref({ followers: 0, following: 0 })
const unlockedBadges = ref<Awaited<ReturnType<typeof getUserBadges>>>([])
const userReviews = ref<Awaited<ReturnType<typeof getUserReviews>>>([])
const allBadges = getAllBadgeDefinitions()
const isLoading = ref(true)
const notFound = ref(false)

type ReviewWithVinyl = Awaited<ReturnType<typeof getUserReviews>>[number] & {
  displayTitle: string
  displayArtist: string
  displayThumb: string | null
}

async function enrichReviews(reviews: Awaited<ReturnType<typeof getUserReviews>>) {
  const enriched: ReviewWithVinyl[] = []
  for (const r of reviews) {
    if (r.vinyl_title && r.vinyl_thumb) {
      enriched.push({
        ...r,
        displayTitle: r.vinyl_title,
        displayArtist: r.vinyl_artist || '',
        displayThumb: r.vinyl_thumb,
      })
    }
    else {
      try {
        const release = await getRelease(r.discogs_id)
        const artist = release.artists?.map((a: { name: string }) => a.name).join(', ') || ''
        const thumb = release.images?.[0]?.uri150 || release.images?.[0]?.uri || null
        enriched.push({
          ...r,
          displayTitle: release.title || `Vinyle #${r.discogs_id}`,
          displayArtist: artist,
          displayThumb: thumb,
        })
      }
      catch {
        enriched.push({
          ...r,
          displayTitle: r.vinyl_title || `Vinyle #${r.discogs_id}`,
          displayArtist: r.vinyl_artist || '',
          displayThumb: r.vinyl_thumb,
        })
      }
    }
  }
  return enriched
}

const displayName = computed(() =>
  (profile.value as { display_name?: string } | null)?.display_name
  || (profile.value as { username?: string } | null)?.username
  || profile.value?.email?.split('@')[0]
  || 'Collectionneur',
)

const userInitials = computed(() => {
  const name = displayName.value
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
})

const avatarUrl = computed(() => (profile.value as { avatar_url?: string } | null)?.avatar_url)

const collectionStats = computed(() => {
  const items = collection.value
  const genreSet = new Set<string>()
  const artistSet = new Set<string>()
  const labelSet = new Set<string>()
  for (const item of items) {
    if (item.genre) for (const g of item.genre) genreSet.add(g)
    if (item.artist) artistSet.add(item.artist)
    if (item.label) labelSet.add(item.label)
  }
  return {
    total: items.length,
    genres: genreSet.size,
    artists: artistSet.size,
    labels: labelSet.size,
    estimatedValue: items.length * 18,
  }
})

const recentActivity = computed(() =>
  [...collection.value]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6),
)

const memberSince = computed(() => {
  const p = profile.value as { created_at?: string } | null
  if (!p?.created_at) return ''
  return new Date(p.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
})

function formatReviewDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

useSeoMeta({
  title: () => `${displayName.value} — GROOV`,
  description: () => `Profil GROOV de ${displayName.value} : ${collectionStats.value.total} vinyles, ${favorites.value.length} en wishlist.`,
})

async function loadProfile() {
  const param = slug.value
  profile.value = null
  collection.value = []
  favorites.value = []
  notFound.value = false
  isLoading.value = true

  if (!param) {
    notFound.value = true
    isLoading.value = false
    return
  }

  const profileQuery = isUuid(param)
    ? supabase.from('profiles').select('*').eq('id', param).single()
    : supabase.from('profiles').select('*').eq('username', param.toLowerCase()).single()

  const { data: profileData, error: profileError } = await profileQuery

  if (profileError || !profileData) {
    notFound.value = true
    isLoading.value = false
    return
  }

  const id = profileData.id
  profile.value = profileData

  const [collRes, favRes] = await Promise.all([
    supabase.from('user_collection').select('*').eq('user_id', id).order('created_at', { ascending: false }),
    supabase.from('user_favorites').select('*').eq('user_id', id).order('created_at', { ascending: false }),
  ])

  collection.value = collRes.data ?? []
  favorites.value = favRes.data ?? []
  isFollowingUser.value = currentUser.value?.id ? await isFollowing(id) : false
  followCounts.value = await getFollowCounts(id)
  unlockedBadges.value = await getUserBadges(id)
  const rawReviews = await getUserReviews(id)
  userReviews.value = await enrichReviews(rawReviews)
  isLoading.value = false
}

watch(slug, loadProfile, { immediate: true })
</script>

<template>
  <div>
    <SubNav />

    <!-- 404 -->
    <div v-if="notFound" class="py-24 text-center">
      <UIcon name="i-lucide-user-x" class="mx-auto mb-4 h-12 w-12 text-g-200" />
      <p class="text-lg font-medium text-g-950">Profil introuvable</p>
      <NuxtLink to="/" class="mt-4 inline-block text-sm text-g-500 underline hover:text-g-950">
        Retour à l'accueil
      </NuxtLink>
    </div>

    <template v-else-if="!isLoading">
      <!-- Header -->
      <section class="relative overflow-hidden bg-g-black px-4 pb-8 pt-6 sm:px-6 sm:pb-12 sm:pt-10">
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-g-800/40 via-transparent to-g-black" />
        <div class="relative mx-auto max-w-[1000px]">
          <div class="flex flex-col items-center gap-6 sm:flex-row sm:items-end sm:gap-8">
            <div class="relative shrink-0">
              <div class="flex h-28 w-28 overflow-hidden rounded-full border-2 border-g-600 bg-g-800 shadow-xl sm:h-36 sm:w-36">
                <img
                  v-if="avatarUrl"
                  :src="avatarUrl"
                  alt="Avatar"
                  class="h-full w-full object-cover"
                >
                <span
                  v-else
                  class="flex h-full w-full items-center justify-center text-3xl font-bold text-g-400 sm:text-4xl"
                >
                  {{ userInitials }}
                </span>
              </div>
            </div>
            <div class="min-w-0 flex-1 text-center sm:text-left">
              <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-g-500">Profil public</p>
              <h1 class="mt-1 text-3xl font-bold tracking-tight text-g-white sm:text-4xl">
                {{ displayName }}
              </h1>
              <p class="mt-1 text-sm text-g-500">{{ profile?.email }}</p>
              <p v-if="memberSince" class="mt-3 text-xs text-g-500">
                Membre depuis {{ memberSince }}
              </p>
            </div>
            <div class="flex shrink-0 flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:gap-6">
              <div class="flex flex-wrap justify-center gap-6 text-center">
                <div>
                  <p class="font-[family-name:var(--font-mono)] text-2xl font-bold text-g-white">{{ collectionStats.total }}</p>
                  <p class="mt-0.5 text-[11px] text-g-500">Vinyles</p>
                </div>
                <div>
                  <p class="font-[family-name:var(--font-mono)] text-2xl font-bold text-g-white">{{ favorites.length }}</p>
                  <p class="mt-0.5 text-[11px] text-g-500">Wishlist</p>
                </div>
                <div>
                  <p class="font-[family-name:var(--font-mono)] text-2xl font-bold text-g-white">{{ followCounts.followers }}</p>
                  <p class="mt-0.5 text-[11px] text-g-500">Followers</p>
                </div>
              </div>
              <button
                v-if="!isOwnProfile && profileId"
                type="button"
                class="mt-2 inline-flex min-h-[40px] cursor-pointer items-center justify-center gap-2 rounded-full border border-g-600 px-4 py-2 text-xs font-medium text-g-100 transition-colors hover:border-g-white hover:bg-g-white/10 disabled:opacity-60"
                :disabled="followLoading"
                @click="async () => {
                  if (!profileId) return
                  followLoading = true
                  const action = isFollowingUser ? unfollow : follow
                  const { error } = await action(profileId)
                  if (!error) {
                    isFollowingUser = !isFollowingUser
                    followCounts.followers += isFollowingUser ? 1 : -1
                  }
                  followLoading = false
                }"
              >
                <UIcon
                  :name="isFollowingUser ? 'i-lucide-user-minus' : 'i-lucide-user-plus'"
                  class="h-3.5 w-3.5"
                />
                <span>{{ isFollowingUser ? 'Se désabonner' : 'S’abonner' }}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats -->
      <section class="border-b border-g-100 px-4 py-6 sm:px-6 sm:py-8">
        <div class="mx-auto max-w-[1000px]">
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div class="rounded-lg border border-g-100 bg-g-white p-4">
              <p class="font-[family-name:var(--font-mono)] text-2xl font-bold text-g-950">{{ collectionStats.genres }}</p>
              <p class="mt-0.5 text-xs text-g-500">Genres</p>
            </div>
            <div class="rounded-lg border border-g-100 bg-g-white p-4">
              <p class="font-[family-name:var(--font-mono)] text-2xl font-bold text-g-950">{{ collectionStats.labels }}</p>
              <p class="mt-0.5 text-xs text-g-500">Labels</p>
            </div>
            <div class="rounded-lg border border-g-100 bg-g-white p-4">
              <p class="font-[family-name:var(--font-mono)] text-2xl font-bold text-g-950">{{ favorites.length }}</p>
              <p class="mt-0.5 text-xs text-g-500">Wishlist</p>
            </div>
            <div class="rounded-lg border border-g-100 bg-g-white p-4">
              <p class="font-[family-name:var(--font-mono)] text-2xl font-bold text-g-950">~{{ collectionStats.estimatedValue.toLocaleString('fr-FR') }}€</p>
              <p class="mt-0.5 text-xs text-g-500">Valeur estimée</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Badges -->
      <section class="border-b border-g-100 px-4 py-6 sm:px-6 sm:py-8">
        <div class="mx-auto max-w-[1000px]">
          <h2 class="mb-5 text-lg font-bold tracking-tight text-g-950">
            Badges ({{ unlockedBadges.length }}/{{ allBadges.length }})
          </h2>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            <div
              v-for="badge in allBadges"
              :key="badge.key"
              class="flex flex-col items-center rounded-lg border p-4 text-center"
              :class="unlockedBadges.some(b => b.key === badge.key)
                ? 'border-g-200 bg-g-white'
                : 'border-g-100 bg-g-50 opacity-40 grayscale'"
            >
              <div class="flex h-12 w-12 items-center justify-center rounded-full" :class="unlockedBadges.some(b => b.key === badge.key) ? 'bg-g-50' : 'bg-g-100'">
                <UIcon :name="badge.icon" class="h-6 w-6" :class="badge.color" />
              </div>
              <p class="mt-2 text-xs font-semibold text-g-950">{{ badge.name }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent activity -->
      <section v-if="recentActivity.length" class="border-b border-g-100 px-4 py-6 sm:px-6 sm:py-8">
        <div class="mx-auto max-w-[1000px]">
          <h2 class="mb-5 text-lg font-bold tracking-tight text-g-950">Derniers ajouts</h2>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-6">
            <NuxtLink
              v-for="item in recentActivity"
              :key="item.id"
              :to="`/vinyl/${item.discogs_id}`"
              class="group cursor-pointer"
            >
              <div class="relative aspect-square overflow-hidden rounded-lg bg-g-100">
                <img
                  v-if="item.cover || item.thumb"
                  :src="item.cover || item.thumb"
                  :alt="item.title || ''"
                  class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                >
              </div>
              <p class="mt-1.5 truncate text-xs font-medium text-g-950">{{ item.title }}</p>
              <p class="truncate text-[11px] text-g-400">{{ item.artist }}</p>
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- Reviews -->
      <section v-if="userReviews.length" class="border-b border-g-100 px-4 py-6 sm:px-6 sm:py-8">
        <div class="mx-auto max-w-[1000px]">
          <h2 class="mb-5 text-lg font-bold tracking-tight text-g-950">Avis</h2>
          <div class="space-y-4">
            <NuxtLink
              v-for="review in userReviews"
              :key="review.id"
              :to="`/vinyl/${review.discogs_id}`"
              class="flex gap-4 rounded-lg border border-g-100 bg-g-white p-4 transition-colors hover:border-g-200"
            >
              <div class="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-g-100 sm:h-20 sm:w-20">
                <img v-if="review.displayThumb" :src="review.displayThumb" :alt="review.displayTitle" class="h-full w-full object-cover">
                <div v-else class="flex h-full w-full items-center justify-center">
                  <UIcon name="i-lucide-disc-3" class="h-8 w-8 text-g-300" />
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <p class="font-medium text-g-950">{{ review.displayTitle }}</p>
                <p v-if="review.displayArtist" class="text-sm text-g-500">{{ review.displayArtist }}</p>
                <div class="mt-1.5 flex items-center gap-2">
                  <div class="flex gap-0.5">
                    <UIcon
                      v-for="i in 5"
                      :key="i"
                      name="i-lucide-star"
                      class="h-3.5 w-3.5"
                      :class="i <= review.rating ? 'fill-current text-amber-400' : 'text-g-200'"
                    />
                  </div>
                  <span class="text-[11px] text-g-400">{{ formatReviewDate(review.created_at) }}</span>
                </div>
                <p v-if="review.title" class="mt-1 text-sm font-medium text-g-700">{{ review.title }}</p>
              </div>
              <UIcon name="i-lucide-chevron-right" class="h-5 w-5 shrink-0 text-g-300" />
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- Link to own profile -->
      <section v-if="isOwnProfile" class="px-4 py-8 sm:px-6">
        <div class="mx-auto max-w-[1000px] text-center">
          <NuxtLink
            to="/profil"
            class="inline-flex items-center gap-2 rounded-lg bg-g-black px-5 py-2.5 text-sm font-medium text-g-white hover:bg-g-700"
          >
            <UIcon name="i-lucide-settings" class="h-4 w-4" />
            Modifier mon profil
          </NuxtLink>
        </div>
      </section>
    </template>

    <div v-else class="flex justify-center py-24">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-g-400" />
    </div>
  </div>
</template>
