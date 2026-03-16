<script lang="ts" setup>
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const toast = useToast()
const { prefs, load } = useUserPrefs()
const { searchReleases } = useDiscogs()
const { start: startOnboarding } = useOnboarding()

definePageMeta({
  middleware: 'auth',
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
const avatarFileInput = ref<HTMLInputElement | null>(null)
const isUploadingAvatar = ref(false)

const userInitials = computed(() => {
  if (displayName.value?.trim()) {
    return displayName.value.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
  }
  return user.value?.email?.substring(0, 2).toUpperCase() || '?'
})

const avatarUrl = computed(() => user.value?.user_metadata?.avatar_url as string | undefined)

// Bibliothèque : mêmes données que la page bibliothèque (Discogs want)
const { data: collectionData } = await useAsyncData('profil-collection', () =>
  searchReleases({ per_page: 100, sort: 'want', sort_order: 'desc' }),
  { lazy: true },
)

const libraryStats = computed(() => {
  const results = collectionData.value?.results ?? []
  const genres = new Set(results.map(r => r.genre?.[0]).filter(Boolean)).size
  const estimatedTotal = results.length * 18
  return {
    total: results.length,
    genres,
    estimatedTotal,
  }
})

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
  await supabase.auth.updateUser({ data: { display_name: displayName.value.trim() } })
  isEditing.value = false
}

function openPrefsEditor() {
  startOnboarding({
    onFinish: load,
    initialGenres: prefs.value.genres,
    initialArtists: prefs.value.artists,
  })
}

watch(user, loadUserMetadata, { immediate: true })

onMounted(() => {
  load()
  loadUserMetadata()
})
</script>

<template>
  <div class="min-h-screen overflow-x-hidden pb-[env(safe-area-inset-bottom,0px)]">
    <AppHeader />
    <SubNav />

    <main class="mx-auto max-w-[800px] px-4 py-8 sm:px-6 sm:py-12">
      <h1 class="text-2xl font-bold tracking-tight text-g-950 sm:text-3xl">
        Mon profil
      </h1>
      <p class="mt-2 text-sm text-g-500">
        Gérez vos préférences et consultez le résumé de votre collection.
      </p>

      <!-- ─── Carte profil ─── -->
      <section class="mt-8 overflow-hidden rounded-lg border border-g-200 bg-g-white shadow-sm">
        <div class="border-b border-g-100 bg-g-50 px-6 py-6">
          <div class="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
            <!-- Avatar -->
            <div class="relative shrink-0">
              <button
                type="button"
                class="group relative flex h-24 w-24 cursor-pointer overflow-hidden rounded-full border-2 border-g-200 bg-g-100 transition-all hover:border-g-400 sm:h-28 sm:w-28"
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
                  class="flex h-full w-full items-center justify-center text-2xl font-bold text-g-500 sm:text-3xl"
                >
                  {{ userInitials }}
                </span>
                <div class="absolute inset-0 flex items-center justify-center bg-g-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <UIcon
                    :name="isUploadingAvatar ? 'i-lucide-loader-2' : 'i-lucide-camera'"
                    class="h-6 w-6 text-g-white"
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

            <!-- Infos -->
            <div class="min-w-0 flex-1 text-center sm:text-left">
              <div v-if="isEditing" class="space-y-4">
                <div>
                  <label class="mb-1.5 block text-xs font-medium text-g-500">Pseudo</label>
                  <input
                    v-model="displayName"
                    type="text"
                    placeholder="Votre pseudo"
                    class="w-full rounded-lg border border-g-200 bg-g-white px-4 py-2.5 text-sm text-g-950 outline-none placeholder:text-g-400 focus:border-g-500"
                  >
                </div>
                <div class="flex gap-2">
                  <UButton
                    size="sm"
                    class="cursor-pointer rounded-lg bg-g-black px-4 py-2 text-sm font-medium text-g-white hover:bg-g-700"
                    @click="saveProfile"
                  >
                    Enregistrer
                  </UButton>
                  <UButton
                    variant="ghost"
                    size="sm"
                    class="cursor-pointer rounded-lg px-4 py-2 text-sm text-g-500 hover:bg-g-100 hover:text-g-950"
                    @click="isEditing = false"
                  >
                    Annuler
                  </UButton>
                </div>
              </div>
              <div v-else>
                <h2 class="text-xl font-semibold text-g-950">
                  {{ displayName || 'Utilisateur' }}
                </h2>
                <p class="mt-1 truncate text-sm text-g-500">{{ user?.email }}</p>
                <button
                  type="button"
                  class="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-g-500 transition-colors hover:text-g-950"
                  @click="isEditing = true"
                >
                  <UIcon name="i-lucide-pencil" class="h-3.5 w-3.5" />
                  Modifier mes infos
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Préférences (genres, artistes) -->
        <div class="border-b border-g-100 px-6 py-6">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-g-950">Préférences</h3>
            <button
              type="button"
              class="cursor-pointer text-xs font-medium text-g-500 transition-colors hover:text-g-950"
              @click="openPrefsEditor"
            >
              Modifier
            </button>
          </div>
          <div class="mt-4 space-y-4">
            <div>
              <p class="mb-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-g-500">
                Genres
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
              <p class="mb-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-g-500">
                Artistes préférés
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

        <!-- Résumé bibliothèque -->
        <div class="px-6 py-6">
          <h3 class="text-sm font-semibold text-g-950">Ma collection</h3>
          <div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div class="rounded-lg border border-g-100 bg-g-50 p-4">
              <p class="font-[family-name:var(--font-mono)] text-2xl font-bold text-g-950">
                {{ libraryStats.total }}
              </p>
              <p class="mt-0.5 text-xs text-g-500">vinyles</p>
            </div>
            <div class="rounded-lg border border-g-100 bg-g-50 p-4">
              <p class="font-[family-name:var(--font-mono)] text-2xl font-bold text-g-950">
                {{ libraryStats.genres }}
              </p>
              <p class="mt-0.5 text-xs text-g-500">genres</p>
            </div>
            <div class="rounded-lg border border-g-100 bg-g-50 p-4 sm:col-span-2 sm:col-span-1">
              <p class="font-[family-name:var(--font-mono)] text-2xl font-bold text-g-950">
                ~{{ libraryStats.estimatedTotal.toLocaleString('fr-FR') }} €
              </p>
              <p class="mt-0.5 text-xs text-g-500">valeur estimée</p>
            </div>
          </div>
          <NuxtLink
            to="/bibliotheque"
            class="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-g-900 transition-colors hover:text-g-700"
          >
            Voir ma bibliothèque
            <UIcon name="i-lucide-arrow-right" class="h-4 w-4" />
          </NuxtLink>
        </div>
      </section>
    </main>

    <AppFooter />
    <OnboardingOverlay />
  </div>
</template>
