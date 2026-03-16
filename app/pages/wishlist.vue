<script lang="ts" setup>
const { favorites, fetchFavorites } = useUserFavorites()

definePageMeta({ middleware: 'auth' })

useSeoMeta({
  title: 'Ma Wishlist — GROOV',
  description: 'Retrouvez tous vos coups de cœur vinyles.',
})

const isLoading = ref(true)

onMounted(async () => {
  await fetchFavorites()
  isLoading.value = false
})
</script>

<template>
  <div>
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
        <UButton class="min-h-[44px] cursor-pointer rounded-lg bg-g-black px-5 py-2.5 text-sm font-medium text-g-white hover:bg-g-700">
          Explorer le catalogue
        </UButton>
      </NuxtLink>
    </div>

    <section v-else class="px-4 py-6 sm:px-6 sm:py-10">
      <div class="mx-auto grid max-w-[1400px] grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        <VinylCard
          v-for="fav in favorites"
          :key="fav.id"
          :id="fav.discogs_id"
          :title="fav.title || ''"
          :artist="fav.artist || ''"
          :thumb="fav.thumb || undefined"
          :cover="fav.cover || undefined"
          :show-actions="false"
        />
      </div>
    </section>
  </div>
</template>
