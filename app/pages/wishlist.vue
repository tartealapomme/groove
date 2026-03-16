<script lang="ts" setup>
const { favorites, fetchFavorites } = useUserFavorites()

definePageMeta({
  middleware: 'auth',
})

const isLoading = ref(true)

onMounted(async () => {
  await fetchFavorites()
  isLoading.value = false
})

function getInitials(name: string) {
  return (name || '').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
}
</script>

<template>
  <div class="min-h-screen pb-[env(safe-area-inset-bottom,0px)]">
    <AppHeader />

    <SubNav />

    <section class="border-b border-g-100 bg-white px-4 sm:px-6">
      <div class="mx-auto max-w-[1400px] py-6 sm:py-8">
        <h1 class="text-2xl font-bold tracking-tight text-g-black sm:text-3xl">Ma Wishlist</h1>
        <p class="mt-1 text-sm text-g-400">
          {{ favorites.length }} coup{{ favorites.length > 1 ? 's' : '' }} de cœur
        </p>
      </div>
    </section>

    <div v-if="isLoading" class="flex items-center justify-center py-24">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-g-400" />
    </div>

    <div v-else-if="!favorites.length" class="flex flex-col items-center justify-center py-24 text-center">
      <UIcon name="i-lucide-heart" class="h-16 w-16 text-g-200 sm:h-20 sm:w-20" />
      <p class="mt-4 text-base font-medium text-g-950">Ta wishlist est vide</p>
      <p class="mt-1 text-sm text-g-500">Ajoute des vinyles en cliquant sur le cœur depuis Explorer ou les fiches vinyle.</p>
      <NuxtLink to="/explore" class="mt-6">
        <UButton
          class="min-h-[44px] cursor-pointer rounded-lg bg-g-black px-5 py-2.5 text-sm font-medium text-g-white hover:bg-g-700"
        >
          Explorer le catalogue
        </UButton>
      </NuxtLink>
    </div>

    <section v-else class="px-4 py-6 sm:px-6 sm:py-10">
      <div class="mx-auto grid max-w-[1400px] grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        <NuxtLink
          v-for="fav in favorites"
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
              decoding="async"
            >
            <div v-else class="flex h-full w-full items-center justify-center bg-g-200">
              <span class="select-none text-3xl font-bold text-g-400/30">
                {{ getInitials(fav.artist) || '?' }}
              </span>
            </div>
            <div class="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
              <p class="truncate text-sm font-medium text-white">{{ fav.title }}</p>
              <p class="truncate text-xs text-white/60">{{ fav.artist }}</p>
            </div>
          </div>
          <div class="mt-2">
            <span class="text-[11px] text-g-400">Voir la fiche</span>
          </div>
        </NuxtLink>
      </div>
    </section>

    <AppFooter />
  </div>
</template>
