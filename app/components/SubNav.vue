<script lang="ts" setup>
const route = useRoute()

const pages = [
  { to: '/', label: 'Accueil' },
  { to: '/explore', label: 'Explorer' },
  { to: '/bibliotheque', label: 'Ma Collection' },
]

const genres = [
  { to: '/explore?genre=Rock', label: 'Rock' },
  { to: '/explore?genre=Jazz', label: 'Jazz' },
  { to: '/explore?genre=Electronic', label: 'Électronique' },
  { to: '/explore?genre=Funk+%2F+Soul', label: 'Soul / Funk' },
  { to: '/explore?genre=Hip+Hop', label: 'Hip-Hop' },
  { to: '/explore?genre=Classical', label: 'Classique' },
  { to: '/explore?genre=Pop', label: 'Pop' },
  { to: '/explore?genre=Reggae', label: 'Reggae' },
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
  <div class="sticky top-24 z-40 border-t border-g-700 bg-g-black">
    <div class="mx-auto max-w-[1400px] px-6">
      <div class="flex items-center gap-1 py-2">
        <template v-for="page in pages" :key="page.to">
          <!-- Explorer with dropdown -->
          <div v-if="page.to === '/explore'" class="group relative">
            <NuxtLink
              :to="page.to"
              class="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors"
              :class="isExploreActive
                ? 'font-medium text-g-white'
                : 'text-g-400 hover:text-g-white'"
            >
              {{ page.label }}
              <UIcon name="i-lucide-chevron-down" class="h-3 w-3 transition-transform group-hover:rotate-180" />
            </NuxtLink>

            <!-- Genre dropdown -->
            <div class="pointer-events-none absolute left-0 top-full z-50 pt-1 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
              <div class="rounded-lg border border-g-700 bg-g-black py-1 shadow-lg">
                <NuxtLink
                  v-for="genre in genres"
                  :key="genre.to"
                  :to="genre.to"
                  class="block cursor-pointer whitespace-nowrap px-4 py-2 text-sm transition-colors"
                  :class="route.fullPath === genre.to
                    ? 'bg-g-700 font-medium text-g-white'
                    : 'text-g-400 hover:bg-g-700 hover:text-g-white'"
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
            class="shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-sm transition-colors"
            :class="isActive(page)
              ? 'font-medium text-g-white'
              : 'text-g-400 hover:text-g-white'"
          >
            {{ page.label }}
          </NuxtLink>
        </template>
      </div>
    </div>
  </div>
</template>
