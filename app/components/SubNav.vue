<script lang="ts" setup>
const route = useRoute()

const pages = [
  { to: '/', label: 'Accueil' },
  { to: '/explore', label: 'Explorer' },
  { to: '/bibliotheque', label: 'Ma Collection' },
]

const genres = [
  { to: '/explore?genre=rock', label: 'Rock' },
  { to: '/explore?genre=jazz', label: 'Jazz' },
  { to: '/explore?genre=electronic', label: 'Électronique' },
  { to: '/explore?genre=soul', label: 'Soul / Funk' },
  { to: '/explore?genre=hiphop', label: 'Hip-Hop' },
  { to: '/explore?genre=classical', label: 'Classique' },
  { to: '/explore?genre=pop', label: 'Pop' },
  { to: '/explore?genre=reggae', label: 'Reggae' },
]

function isActive(link: { to: string }) {
  if (link.to === '/') return route.path === '/'
  if (link.to === '/explore') return route.path === '/explore'
  if (link.to === '/bibliotheque') return route.path === '/bibliotheque'
  return route.fullPath === link.to
}

const isExploreActive = computed(() => route.path === '/explore')
</script>

<template>
  <div class="border-b border-g-100 bg-g-50">
    <div class="mx-auto max-w-[1400px] px-6">
      <div class="flex items-center gap-1 py-2">
        <template v-for="page in pages" :key="page.to">
          <!-- Explorer with dropdown -->
          <div v-if="page.to === '/explore'" class="group relative">
            <NuxtLink
              :to="page.to"
              class="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-all"
              :class="isExploreActive
                ? 'font-medium text-g-950'
                : 'text-g-400 hover:text-g-950'"
            >
              {{ page.label }}
              <UIcon name="i-lucide-chevron-down" class="h-3 w-3 transition-transform group-hover:rotate-180" />
            </NuxtLink>

            <!-- Genre dropdown -->
            <div class="pointer-events-none absolute left-0 top-full z-50 pt-1 opacity-0 transition-all group-hover:pointer-events-auto group-hover:opacity-100">
              <div class="rounded-lg border border-g-100 bg-white py-1 shadow-lg">
                <NuxtLink
                  v-for="genre in genres"
                  :key="genre.to"
                  :to="genre.to"
                  class="block cursor-pointer whitespace-nowrap px-4 py-2 text-sm transition-colors"
                  :class="route.fullPath === genre.to
                    ? 'bg-g-50 font-medium text-g-950'
                    : 'text-g-500 hover:bg-g-50 hover:text-g-950'"
                >
                  {{ genre.label }}
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Regular page link -->
          <NuxtLink
            v-else
            :to="page.to"
            class="shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-sm transition-all"
            :class="isActive(page)
              ? 'font-medium text-g-950'
              : 'text-g-400 hover:text-g-950'"
          >
            {{ page.label }}
          </NuxtLink>
        </template>
      </div>
    </div>
  </div>
</template>
