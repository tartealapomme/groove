<script lang="ts" setup>
const props = defineProps<{
  discogsId: number
  title: string
  artist: string
  thumb?: string
  cover?: string
  label?: string
  genre?: string | string[]
  year?: string
}>()

const user = useSupabaseUser()
const toast = useToast()
const { openRegister } = useAuthModal()
const { addToCollection, removeFromCollection, isInCollection, fetchCollection } = useUserCollection()
const { addFavorite, removeFavorite, isFavorite, fetchFavorites } = useUserFavorites()

const inCollection = computed(() => isInCollection(props.discogsId))
const inFavorites = computed(() => isFavorite(props.discogsId))

const justToggledCollection = ref(false)
const justToggledFavorite = ref(false)

function ping(refFlag: Ref<boolean>) {
  refFlag.value = false
  requestAnimationFrame(() => {
    refFlag.value = true
    setTimeout(() => { refFlag.value = false }, 250)
  })
}

async function toggleCollection() {
  const wasIn = inCollection.value
  const { error } = wasIn
    ? await removeFromCollection(props.discogsId)
    : await addToCollection({
        discogs_id: props.discogsId,
        title: props.title,
        artist: props.artist,
        year: props.year ?? null,
        label: props.label ?? null,
        genre: Array.isArray(props.genre) ? props.genre : (props.genre ? [props.genre] : []),
        thumb: props.thumb ?? null,
        cover: props.cover ?? null,
      })
  if (error) {
    if (error.message?.toLowerCase().includes('non connecté') || error.message?.toLowerCase().includes('utilisateur non connecté')) {
      openRegister()
    }
    toast.add({ title: 'Erreur', description: error.message, color: 'error' })
    return
  }
  await fetchCollection()
  ping(justToggledCollection)
}

async function toggleFavorite() {
  const wasIn = inFavorites.value
  const { error } = wasIn
    ? await removeFavorite(props.discogsId)
    : await addFavorite({
        discogs_id: props.discogsId,
        title: props.title,
        artist: props.artist,
        thumb: props.thumb ?? null,
        cover: props.cover ?? null,
      })
  if (error) {
    if (error.message?.toLowerCase().includes('non connecté') || error.message?.toLowerCase().includes('utilisateur non connecté')) {
      openRegister()
    }
    toast.add({ title: 'Erreur', description: error.message, color: 'error' })
    return
  }
  await fetchFavorites()
  ping(justToggledFavorite)
}
</script>

<template>
  <div class="pointer-events-auto absolute right-2 top-2 z-10 flex items-center gap-1">
    <!-- Collection -->
    <button
      class="flex min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-lg transition-all"
      :class="[
        inCollection
          ? 'bg-g-black text-g-white hover:bg-g-700'
          : 'bg-g-black/50 text-g-white hover:bg-g-black/80 sm:opacity-0 sm:group-hover:opacity-100',
        justToggledCollection ? 'scale-110 ring-2 ring-g-white/70 ring-offset-2 ring-offset-g-black/60' : 'scale-100',
      ]"
      :title="inCollection ? 'Retirer de ma collection' : 'Ajouter à ma collection'"
      @click.prevent="toggleCollection"
    >
      <UIcon
        :name="inCollection ? 'i-lucide-check' : 'i-lucide-plus'"
        class="h-4 w-4 transition-transform"
        :class="justToggledCollection ? 'scale-125' : 'scale-100'"
      />
    </button>
    <!-- Favori -->
    <button
      class="flex min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-lg transition-all"
      :class="[
        inFavorites
          ? 'bg-red-500/90 text-white hover:bg-red-500'
          : 'bg-g-black/50 text-g-white hover:bg-g-black/80 sm:opacity-0 sm:group-hover:opacity-100',
        justToggledFavorite ? 'scale-110 ring-2 ring-red-200 ring-offset-2 ring-offset-g-black/60' : 'scale-100',
      ]"
      :title="inFavorites ? 'Retirer des favoris' : 'Ajouter aux favoris'"
      @click.prevent="toggleFavorite"
    >
      <UIcon
        :name="inFavorites ? 'i-lucide-heart' : 'i-lucide-heart'"
        class="h-4 w-4 transition-transform"
        :class="[{ 'fill-current': inFavorites }, justToggledFavorite ? 'scale-125' : 'scale-100']"
      />
    </button>
  </div>
</template>
