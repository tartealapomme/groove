<script lang="ts" setup>
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const toast = useToast()
const { prefs, load: loadPrefs } = useUserPrefs()
const { start: startOnboarding } = useOnboarding()
const { collection, fetchCollection } = useUserCollection()
const { favorites, fetchFavorites } = useUserFavorites()
const { getRecommendations } = useRecommendations()
const { getFollowCounts } = useUserFollows()
const { getUserBadges, checkAndAwardBadges, getAllBadgeDefinitions } = useBadges()
const { getUserReviews } = useVinylReviews()
const { getRelease } = useDiscogs()

definePageMeta({ middleware: 'auth' })

useSeoMeta({
  title: 'Mon Profil — GROOV',
  description: 'Votre profil GROOV : collection, wishlist, préférences et recommandations personnalisées.',
})

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

const isEditing = ref(false)
const displayName = ref('')
const profileUsername = ref('')
const avatarFileInput = ref<HTMLInputElement | null>(null)
const isUploadingAvatar = ref(false)
const isLoading = ref(true)

const userInitials = computed(() => {
  if (displayName.value?.trim()) {
    return displayName.value.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
  }
  return user.value?.email?.substring(0, 2).toUpperCase() || '?'
})

const avatarUrl = computed(() => user.value?.user_metadata?.avatar_url as string | undefined)

// Stats from actual user data
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

const topGenres = computed(() => {
  const counts = new Map<string, number>()
  for (const item of collection.value) {
    if (item.genre) {
      for (const g of item.genre) {
        counts.set(g, (counts.get(g) ?? 0) + 1)
      }
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre, count]) => ({ genre, count, label: genreLabels[genre] || genre }))
})

const topArtists = computed(() => {
  const counts = new Map<string, number>()
  for (const item of collection.value) {
    if (item.artist) {
      counts.set(item.artist, (counts.get(item.artist) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([artist, count]) => ({ artist, count }))
})

const recentActivity = computed(() => {
  return [...collection.value]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6)
})

const { data: recommendations } = await useAsyncData(
  'profile-recommendations',
  () => getRecommendations(6),
  { lazy: true, watch: [user] },
)

function loadUserMetadata() {
  displayName.value = (user.value?.user_metadata?.display_name as string) || ''
}

function triggerAvatarUpload() {
  avatarFileInput.value?.click()
}

async function onAvatarChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !file.type.startsWith('image/')) return

  isUploadingAvatar.value = true
  try {
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${user.value?.id}/avatar.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase.auth.updateUser({ data: { avatar_url: publicUrl } })
  }
  catch (err) {
    console.error('Avatar upload failed:', err)
    toast.add({
      title: 'Erreur',
      description: 'Impossible de changer la photo. Vérifiez que le bucket "avatars" existe dans Supabase Storage.',
      color: 'error',
    })
  }
  finally {
    isUploadingAvatar.value = false
    input.value = ''
  }
}

async function saveProfile() {
  const uid = user.value?.id
  if (!uid) return

  const display = displayName.value.trim()
  await supabase.auth.updateUser({ data: { display_name: display } })
  await supabase.from('profiles').update({ display_name: display || null }).eq('id', uid)

  const raw = profileUsername.value.toLowerCase().trim()
  if (raw && /^[a-z0-9_]{3,30}$/.test(raw)) {
    const { error } = await supabase.from('profiles').update({ username: raw }).eq('id', uid)
    if (error) {
      toast.add({ title: 'Erreur', description: error.code === '23505' ? 'Ce pseudo est déjà pris.' : error.message, color: 'error' })
      return
    }
    profileUsername.value = raw
  }

  isEditing.value = false
  toast.add({ title: 'Profil mis à jour', color: 'success' })
}

function openPrefsEditor() {
  startOnboarding({
    onFinish: loadPrefs,
    initialGenres: prefs.value.genres,
    initialArtists: prefs.value.artists,
  })
}

const memberSince = computed(() => {
  if (!user.value?.created_at) return ''
  return new Date(user.value.created_at).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
})

// Follows
const followCounts = ref({ followers: 0, following: 0 })

// Reviews (enriched with Discogs data when vinyl_title/thumb missing)
type ReviewWithVinyl = Awaited<ReturnType<typeof getUserReviews>>[number] & {
  displayTitle: string
  displayArtist: string
  displayThumb: string | null
}
const userReviews = ref<ReviewWithVinyl[]>([])

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

async function shareProfile() {
  const url = profileUsername.value ? `${typeof window !== 'undefined' ? window.location.origin : ''}/profil/${profileUsername.value}` : (typeof window !== 'undefined' ? window.location.href : '')
  const text = `Découvrez mon profil GROOV : ${displayName.value || 'Collectionneur'}`
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Mon profil GROOV',
        text,
        url,
      })
      toast.add({ title: 'Profil partagé', color: 'success' })
    }
    catch (e) {
      if ((e as Error).name !== 'AbortError') {
        await copyProfileLink()
      }
    }
  }
  else {
    await copyProfileLink()
  }
}

async function copyProfileLink() {
  const url = profileUsername.value && typeof window !== 'undefined'
    ? `${window.location.origin}/profil/${profileUsername.value}`
    : (typeof window !== 'undefined' ? window.location.href : '')
  try {
    await navigator.clipboard.writeText(url)
    toast.add({ title: 'Lien copié dans le presse-papier', color: 'success' })
  }
  catch {
    toast.add({ title: 'Impossible de copier le lien', color: 'error' })
  }
}

function formatReviewDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Badges
const unlockedBadges = ref<Awaited<ReturnType<typeof getUserBadges>>>([])
const allBadges = getAllBadgeDefinitions()
const newlyUnlocked = ref<typeof allBadges>([])

async function refreshBadges() {
  // Récupère l'id utilisateur de manière robuste
  let uid = user.value?.id

  if (!uid) {
    const { data: { session } } = await supabase.auth.getSession()
    uid = session?.user?.id ?? null
  }

  if (!uid) return

  const allGenres: string[] = []
  for (const item of collection.value) {
    if (item.genre) allGenres.push(...item.genre)
  }

  const newOnes = await checkAndAwardBadges({
    collectionCount: collection.value.length,
    wishlistCount: favorites.value.length,
    genreCount: new Set(allGenres).size,
    artistCount: new Set(collection.value.map(c => c.artist).filter(Boolean)).size,
    labelCount: new Set(collection.value.map(c => c.label).filter(Boolean)).size,
    reviewCount: userReviews.value.length,
    followerCount: followCounts.value.followers,
    followingCount: followCounts.value.following,
    genres: allGenres,
  })

  if (newOnes.length) {
    newlyUnlocked.value = newOnes
    for (const badge of newOnes) {
      toast.add({ title: `Badge débloqué : ${badge.name}`, description: badge.description, color: 'success' })
    }
  }

  unlockedBadges.value = await getUserBadges(uid)
}

watch(user, loadUserMetadata, { immediate: true })

onMounted(async () => {
  isLoading.value = true
  await Promise.all([loadPrefs(), fetchCollection(), fetchFavorites()])
  loadUserMetadata()

  let uid = user.value?.id ?? (await supabase.auth.getSession()).data.session?.user?.id ?? null
  if (uid) {
    const { data: p } = await supabase.from('profiles').select('username, display_name').eq('id', uid).single()
    profileUsername.value = p?.username ?? ''
    if (p?.display_name && !displayName.value) displayName.value = p.display_name
    followCounts.value = await getFollowCounts(uid)
    const rawReviews = await getUserReviews(uid)
    userReviews.value = await enrichReviews(rawReviews)
  }

  await refreshBadges()
  isLoading.value = false
})
</script>

<template>
  <div>
    <!-- ─── PROFILE HEADER (dark, immersive) ─── -->
    <section class="relative overflow-hidden bg-g-black px-4 pb-8 pt-6 sm:px-6 sm:pb-12 sm:pt-10">
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-g-800/40 via-transparent to-g-black" />
      <div class="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-g-white/[0.02] blur-3xl" />

      <div class="relative mx-auto max-w-[1000px]">
        <div class="flex flex-col items-center gap-6 sm:flex-row sm:items-end sm:gap-8">
          <!-- Avatar -->
          <div class="relative shrink-0">
            <button
              type="button"
              class="group relative flex h-28 w-28 cursor-pointer overflow-hidden rounded-full border-2 border-g-600 bg-g-800 shadow-xl transition-all hover:border-g-400 sm:h-36 sm:w-36"
              @click="triggerAvatarUpload"
            >
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
              <div class="absolute inset-0 flex items-center justify-center bg-g-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                <UIcon
                  :name="isUploadingAvatar ? 'i-lucide-loader-2' : 'i-lucide-camera'"
                  class="h-7 w-7 text-g-white"
                  :class="{ 'animate-spin': isUploadingAvatar }"
                />
              </div>
            </button>
            <input
              ref="avatarFileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onAvatarChange"
            >
          </div>

          <!-- User info -->
          <div class="min-w-0 flex-1 text-center sm:text-left">
            <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-g-500">Profil</p>

            <div v-if="isEditing" class="mt-2 space-y-3">
              <div>
                <label class="mb-1 block text-xs text-g-400">Nom affiché</label>
                <input
                  v-model="displayName"
                  type="text"
                  placeholder="Votre nom"
                  class="w-full max-w-xs rounded-lg border border-g-600 bg-g-800 px-4 py-2.5 text-lg font-bold text-g-white outline-none placeholder:text-g-500 focus:border-g-400"
                >
              </div>
              <div>
                <label class="mb-1 block text-xs text-g-400">Pseudo (URL du profil)</label>
                <input
                  v-model="profileUsername"
                  type="text"
                  placeholder="johndoe"
                  class="w-full max-w-xs rounded-lg border border-g-600 bg-g-800 px-4 py-2.5 text-sm text-g-white outline-none placeholder:text-g-500 focus:border-g-400"
                >
                <p class="mt-1 text-[11px] text-g-500">
                  groove.app/profil/{{ profileUsername || '...' }}
                </p>
              </div>
              <div class="flex gap-2">
                <UButton
                  size="sm"
                  class="cursor-pointer rounded-lg bg-g-white px-4 py-2 text-sm font-medium text-g-black hover:bg-g-200"
                  @click="saveProfile"
                >
                  Enregistrer
                </UButton>
                <UButton
                  variant="ghost"
                  size="sm"
                  class="cursor-pointer rounded-lg px-4 py-2 text-sm text-g-500 hover:text-g-white"
                  @click="isEditing = false"
                >
                  Annuler
                </UButton>
              </div>
            </div>
            <div v-else>
              <h1 class="mt-1 text-3xl font-bold tracking-tight text-g-white sm:text-4xl">
                {{ displayName || profileUsername || 'Utilisateur' }}
              </h1>
              <p class="mt-1 text-sm text-g-500">{{ user?.email }}</p>
              <div class="mt-3 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                <span v-if="memberSince" class="text-xs text-g-500">
                  Membre depuis {{ memberSince }}
                </span>
                <button
                  type="button"
                  class="cursor-pointer text-xs font-medium text-g-400 transition-colors hover:text-g-white"
                  @click="isEditing = true"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-g-600 px-3 py-1.5 text-xs font-medium text-g-300 transition-colors hover:border-g-400 hover:bg-g-800 hover:text-g-white"
                  title="Partager mon profil"
                  @click="shareProfile"
                >
                  <UIcon name="i-lucide-share-2" class="h-3.5 w-3.5" />
                  Partager
                </button>
              </div>
            </div>
          </div>

          <!-- Quick stats (header) -->
          <div class="flex shrink-0 flex-wrap justify-center gap-6 text-center sm:gap-8">
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
            <div>
              <p class="font-[family-name:var(--font-mono)] text-2xl font-bold text-g-white">{{ followCounts.following }}</p>
              <p class="mt-0.5 text-[11px] text-g-500">Following</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── LOADING ─── -->
    <div v-if="isLoading" class="flex items-center justify-center py-24">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-g-400" />
    </div>

    <template v-else>
      <!-- ─── STATS GRID ─── -->
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

      <!-- ─── BADGES ─── -->
      <section class="border-b border-g-100 px-4 py-6 sm:px-6 sm:py-8">
        <div class="mx-auto max-w-[1000px]">
          <div class="mb-5 flex items-end justify-between">
            <div>
              <p class="text-[11px] font-medium uppercase tracking-[0.2em] text-g-400">Accomplissements</p>
              <h2 class="mt-1 text-lg font-bold tracking-tight text-g-950">
                Badges
                <span class="text-g-400">({{ unlockedBadges.length }}/{{ allBadges.length }})</span>
              </h2>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            <div
              v-for="badge in allBadges"
              :key="badge.key"
              class="flex flex-col items-center rounded-lg border p-4 text-center transition-all"
              :class="unlockedBadges.some(b => b.key === badge.key)
                ? 'border-g-200 bg-g-white shadow-sm'
                : 'border-g-100 bg-g-50 opacity-40 grayscale'"
            >
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full"
                :class="unlockedBadges.some(b => b.key === badge.key)
                  ? 'bg-g-50'
                  : 'bg-g-100'"
              >
                <UIcon :name="badge.icon" class="h-6 w-6" :class="badge.color" />
              </div>
              <p class="mt-2 text-xs font-semibold text-g-950">{{ badge.name }}</p>
              <p class="mt-0.5 text-[10px] leading-tight text-g-400">{{ badge.description }}</p>
              <p
                v-if="unlockedBadges.find(b => b.key === badge.key)"
                class="mt-1.5 text-[10px] text-g-400"
              >
                {{ new Date(unlockedBadges.find(b => b.key === badge.key)!.unlocked_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── TWO COLUMNS: Preferences + Top ─── -->
      <section class="px-4 py-6 sm:px-6 sm:py-8">
        <div class="mx-auto grid max-w-[1000px] gap-6 lg:grid-cols-[1fr_1fr] lg:gap-8">
          <!-- Préférences -->
          <div class="overflow-hidden rounded-lg border border-g-100 bg-g-white">
            <div class="flex items-center justify-between border-b border-g-100 px-5 py-4">
              <h2 class="text-sm font-semibold text-g-950">Mes préférences</h2>
              <button
                type="button"
                class="cursor-pointer text-xs font-medium text-g-500 transition-colors hover:text-g-950"
                @click="openPrefsEditor"
              >
                Modifier
              </button>
            </div>
            <div class="space-y-5 px-5 py-5">
              <div>
                <p class="mb-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-g-400">
                  Genres favoris
                </p>
                <div v-if="prefs.genres.length" class="flex flex-wrap gap-2">
                  <span
                    v-for="g in prefs.genres"
                    :key="g"
                    class="rounded-lg border border-g-200 bg-g-50 px-3 py-1.5 text-sm text-g-700"
                  >
                    {{ genreLabels[g] || g }}
                  </span>
                </div>
                <p v-else class="text-sm text-g-400">Aucun genre sélectionné</p>
              </div>
              <div>
                <p class="mb-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-g-400">
                  Artistes favoris
                </p>
                <div v-if="prefs.artists.length" class="flex flex-wrap gap-2">
                  <span
                    v-for="a in prefs.artists"
                    :key="a"
                    class="rounded-lg border border-g-200 bg-g-50 px-3 py-1.5 text-sm text-g-700"
                  >
                    {{ a }}
                  </span>
                </div>
                <p v-else class="text-sm text-g-400">Aucun artiste sélectionné</p>
              </div>
            </div>
          </div>

          <!-- Top genres & artistes (from collection data) -->
          <div class="overflow-hidden rounded-lg border border-g-100 bg-g-white">
            <div class="border-b border-g-100 px-5 py-4">
              <h2 class="text-sm font-semibold text-g-950">Ma collection en chiffres</h2>
            </div>
            <div class="space-y-5 px-5 py-5">
              <!-- Top genres bar chart -->
              <div>
                <p class="mb-3 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-g-400">
                  Genres les plus collectionnés
                </p>
                <div v-if="topGenres.length" class="space-y-2">
                  <div v-for="g in topGenres" :key="g.genre" class="flex items-center gap-3">
                    <span class="w-24 shrink-0 truncate text-xs text-g-600">{{ g.label }}</span>
                    <div class="relative h-5 flex-1 overflow-hidden rounded-lg bg-g-100">
                      <div
                        class="absolute inset-y-0 left-0 rounded-lg bg-g-black transition-all duration-500"
                        :style="{ width: `${Math.max(8, (g.count / (topGenres[0]?.count || 1)) * 100)}%` }"
                      />
                    </div>
                    <span class="w-6 shrink-0 text-right font-[family-name:var(--font-mono)] text-xs text-g-400">{{ g.count }}</span>
                  </div>
                </div>
                <p v-else class="text-sm text-g-400">Ajoutez des vinyles pour voir vos stats</p>
              </div>

              <!-- Top artistes -->
              <div>
                <p class="mb-3 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-g-400">
                  Artistes les plus collectionnés
                </p>
                <div v-if="topArtists.length" class="flex flex-wrap gap-2">
                  <span
                    v-for="a in topArtists"
                    :key="a.artist"
                    class="inline-flex items-center gap-1.5 rounded-lg bg-g-black px-3 py-1.5 text-xs font-medium text-g-white"
                  >
                    {{ a.artist }}
                    <span class="rounded bg-g-700 px-1.5 py-0.5 text-[10px] text-g-400">{{ a.count }}</span>
                  </span>
                </div>
                <p v-else class="text-sm text-g-400">Ajoutez des vinyles pour voir vos artistes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── MY REVIEWS ─── -->
      <section v-if="userReviews.length" class="border-t border-g-100 px-4 py-6 sm:px-6 sm:py-8">
        <div class="mx-auto max-w-[1000px]">
          <div class="mb-5 flex items-end justify-between">
            <div>
              <p class="text-[11px] font-medium uppercase tracking-[0.2em] text-g-400">Communauté</p>
              <h2 class="mt-1 text-lg font-bold tracking-tight text-g-950">Mes avis</h2>
            </div>
          </div>
          <div class="space-y-4">
            <NuxtLink
              v-for="review in userReviews"
              :key="review.id"
              :to="`/vinyl/${review.discogs_id}`"
              class="flex cursor-pointer gap-4 rounded-lg border border-g-100 bg-g-white p-4 transition-colors hover:border-g-200 hover:bg-g-50"
            >
              <div class="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-g-100 sm:h-20 sm:w-20">
                <img
                  v-if="review.displayThumb"
                  :src="review.displayThumb"
                  :alt="review.displayTitle"
                  class="h-full w-full object-cover"
                  loading="lazy"
                >
                <div v-else class="flex h-full w-full items-center justify-center">
                  <UIcon name="i-lucide-disc-3" class="h-8 w-8 text-g-300" />
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <p class="font-medium text-g-950">{{ review.displayTitle }}</p>
                <p v-if="review.displayArtist" class="text-sm text-g-500">{{ review.displayArtist }}</p>
                <div class="mt-1.5 flex items-center gap-2">
                  <div class="flex items-center gap-0.5">
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
                <p v-if="review.body" class="mt-0.5 line-clamp-2 text-sm text-g-500">{{ review.body }}</p>
              </div>
              <UIcon name="i-lucide-chevron-right" class="h-5 w-5 shrink-0 text-g-300" />
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- ─── RECENT ACTIVITY ─── -->
      <section v-if="recentActivity.length" class="border-t border-g-100 px-4 py-6 sm:px-6 sm:py-8">
        <div class="mx-auto max-w-[1000px]">
          <div class="mb-5 flex items-end justify-between">
            <div>
              <p class="text-[11px] font-medium uppercase tracking-[0.2em] text-g-400">Activité récente</p>
              <h2 class="mt-1 text-lg font-bold tracking-tight text-g-950">Derniers ajouts</h2>
            </div>
            <NuxtLink to="/bibliotheque" class="cursor-pointer text-xs font-medium text-g-500 transition-colors hover:text-g-950">
              Voir tout →
            </NuxtLink>
          </div>
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



      <!-- ─── WISHLIST PREVIEW ─── -->
      <section v-if="favorites.length" class="border-t border-g-100 px-4 py-6 sm:px-6 sm:py-8">
        <div class="mx-auto max-w-[1000px]">
          <div class="mb-5 flex items-end justify-between">
            <div>
              <p class="text-[11px] font-medium uppercase tracking-[0.2em] text-g-400">Coups de cœur</p>
              <h2 class="mt-1 text-lg font-bold tracking-tight text-g-950">Ma Wishlist</h2>
            </div>
            <NuxtLink to="/wishlist" class="cursor-pointer text-xs font-medium text-g-500 transition-colors hover:text-g-950">
              Voir tout →
            </NuxtLink>
          </div>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-6">
            <NuxtLink
              v-for="fav in favorites.slice(0, 6)"
              :key="fav.id"
              :to="`/vinyl/${fav.discogs_id}`"
              class="group cursor-pointer"
            >
              <div class="relative aspect-square overflow-hidden rounded-lg bg-g-100">
                <img
                  v-if="fav.cover || fav.thumb"
                  :src="fav.cover || fav.thumb"
                  :alt="fav.title || ''"
                  class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                >
              </div>
              <p class="mt-1.5 truncate text-xs font-medium text-g-950">{{ fav.title }}</p>
              <p class="truncate text-[11px] text-g-400">{{ fav.artist }}</p>
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- ─── RECOMMENDATIONS ─── -->
      <section v-if="recommendations?.length" class="border-t border-g-100 bg-g-50 px-4 py-6 sm:px-6 sm:py-8">
        <div class="mx-auto max-w-[1000px]">
          <div class="mb-5">
            <p class="text-[11px] font-medium uppercase tracking-[0.2em] text-g-400">Pour vous</p>
            <h2 class="mt-1 text-lg font-bold tracking-tight text-g-950">Recommandations</h2>
            <p class="mt-1 text-sm text-g-500">Basé sur vos genres, artistes et votre collection.</p>
          </div>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-6">
            <div v-for="rec in recommendations" :key="rec.id">
              <VinylCard
                :id="rec.id"
                :title="rec.title"
                :artist="rec.artist"
                :year="rec.year"
                :thumb="rec.thumb"
                :cover="rec.cover"
                :community="rec.community"
              />
              <p class="mt-0.5 truncate text-[10px] text-g-400">{{ rec.reason }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── QUICK LINKS ─── -->
      <section class="border-t border-g-100 px-4 py-6 sm:px-6 sm:py-8">
        <div class="mx-auto grid max-w-[1000px] grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <NuxtLink
            to="/bibliotheque"
            class="flex cursor-pointer items-center gap-4 rounded-lg border border-g-100 bg-g-white p-5 transition-colors hover:border-g-300"
          >
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-g-black">
              <UIcon name="i-lucide-library-big" class="h-5 w-5 text-g-white" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-g-950">Ma Collection</p>
              <p class="text-xs text-g-400">{{ collectionStats.total }} vinyles</p>
            </div>
          </NuxtLink>
          <NuxtLink
            to="/wishlist"
            class="flex cursor-pointer items-center gap-4 rounded-lg border border-g-100 bg-g-white p-5 transition-colors hover:border-g-300"
          >
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-g-black">
              <UIcon name="i-lucide-heart" class="h-5 w-5 text-g-white" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-g-950">Ma Wishlist</p>
              <p class="text-xs text-g-400">{{ favorites.length }} coups de cœur</p>
            </div>
          </NuxtLink>
          <NuxtLink
            to="/explore"
            class="flex cursor-pointer items-center gap-4 rounded-lg border border-g-100 bg-g-white p-5 transition-colors hover:border-g-300"
          >
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-g-black">
              <UIcon name="i-lucide-compass" class="h-5 w-5 text-g-white" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-g-950">Explorer</p>
              <p class="text-xs text-g-400">Découvrir de nouveaux vinyles</p>
            </div>
          </NuxtLink>
        </div>
      </section>
    </template>

  </div>
</template>
