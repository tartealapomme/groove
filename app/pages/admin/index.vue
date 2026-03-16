<script lang="ts" setup>
import type { Database } from '~/database.types'

definePageMeta({
  middleware: 'admin',
})

const { profile } = useCurrentProfile()

const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const { searchReleases } = useDiscogs()

const activeTab = ref<'overview' | 'users' | 'collections' | 'favorites'>('overview')

const tabs = [
  { id: 'overview', label: 'Vue d’ensemble', icon: 'i-lucide-gauge' },
  { id: 'users', label: 'Utilisateurs', icon: 'i-lucide-users' },
  { id: 'collections', label: 'Collections', icon: 'i-lucide-library' },
  { id: 'favorites', label: 'Wishlists', icon: 'i-lucide-heart' },
]

// Stats overview
const { data: stats } = await useAsyncData('admin-stats', async () => {
  const [usersRes, collRes, favRes] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('user_collection').select('*', { count: 'exact', head: true }),
    supabase.from('user_favorites').select('*', { count: 'exact', head: true }),
  ])

  return {
    users: usersRes.count ?? 0,
    collections: collRes.count ?? 0,
    favorites: favRes.count ?? 0,
  }
})

// Utilisateurs
const { data: profilesData, refresh: refreshProfiles } = await useAsyncData('admin-profiles', async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[groov] admin profiles error', error)
    return []
  }
  return data || []
})

const updatingUserIds = ref<Set<string>>(new Set())

async function toggleRole(row: { id: string, role: 'user' | 'admin' }) {
  if (!user.value) return
  const nextRole = row.role === 'admin' ? 'user' : 'admin'

  const set = new Set(updatingUserIds.value)
  set.add(row.id)
  updatingUserIds.value = set

  const { error } = await supabase
    .from('profiles')
    .update({ role: nextRole })
    .eq('id', row.id)

  if (error) {
    console.error('[groov] update role error', error)
  }

  const set2 = new Set(updatingUserIds.value)
  set2.delete(row.id)
  updatingUserIds.value = set2

  await refreshProfiles()
}

const profiles = computed(() => profilesData.value || [])

// Map user_id -> profil pour annoter les collections / favoris
const profilesMap = computed(() => {
  const map = new Map<string, any>()
  for (const p of profiles.value) {
    map.set(p.id, p)
  }
  return map
})

// Collections globales
const { data: collectionsData } = await useAsyncData('admin-collections', async () => {
  const { data, error } = await supabase
    .from('user_collection')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('[groov] admin collections error', error)
    return []
  }
  return data || []
})

const collections = computed(() => collectionsData.value || [])

async function saveCollectionRow(row: any) {
  const { error } = await supabase
    .from('user_collection')
    .update({
      title: row.title,
      artist: row.artist,
      year: row.year,
      label: row.label,
      condition: row.condition,
      notes: row.notes,
    })
    .eq('id', row.id)

  if (error) {
    console.error('[groov] save collection error', error)
    return
  }
}

async function deleteCollectionRow(rowId: string) {
  const { error } = await supabase
    .from('user_collection')
    .delete()
    .eq('id', rowId)

  if (error) {
    console.error('[groov] delete collection error', error)
    return
  }
}

// Favorites globales
const { data: favoritesData } = await useAsyncData('admin-favorites', async () => {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('[groov] admin favorites error', error)
    return []
  }
  return data || []
})

const favorites = computed(() => favoritesData.value || [])
</script>

<template>
  <div class="bg-g-50">
    <main class="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
      <header class="mb-6 flex flex-col justify-between gap-3 sm:mb-8 sm:flex-row sm:items-end">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-500 sm:text-xs">
            Backoffice
          </p>
          <h1 class="mt-1 text-2xl font-bold tracking-tight text-g-950 sm:text-3xl">
            Panneau d’administration
          </h1>
          <p class="mt-1 text-sm text-g-500">
            Connecté en tant que
            <span class="font-medium text-g-900">{{ profile?.email || 'admin' }}</span>
            · rôle
            <span class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
              {{ profile?.role || 'admin' }}
            </span>
          </p>
        </div>
      </header>

      <!-- Tabs -->
      <nav class="mb-6 flex gap-2 overflow-x-auto scrollbar-none border-b border-g-200 pb-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm"
          :class="activeTab === tab.id
            ? 'bg-g-950 text-g-white'
            : 'text-g-500 hover:bg-g-100 hover:text-g-950'"
          @click="activeTab = tab.id as any"
        >
          <UIcon :name="tab.icon" class="h-4 w-4" />
          {{ tab.label }}
        </button>
      </nav>

      <!-- Content -->
      <section v-if="activeTab === 'overview'" class="space-y-6">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-xl border border-g-200 bg-white p-4">
            <p class="text-[11px] font-medium uppercase tracking-[0.15em] text-g-400">Utilisateurs</p>
            <p class="mt-2 text-2xl font-bold text-g-950">
              {{ stats?.users ?? '—' }}
            </p>
            <p class="mt-1 text-xs text-g-500">Nombre total de comptes Supabase.</p>
          </div>
          <div class="rounded-xl border border-g-200 bg-white p-4">
            <p class="text-[11px] font-medium uppercase tracking-[0.15em] text-g-400">Vinyles en collection</p>
            <p class="mt-2 text-2xl font-bold text-g-950">
              {{ stats?.collections ?? '—' }}
            </p>
            <p class="mt-1 text-xs text-g-500">Total lignes dans user_collection.</p>
          </div>
          <div class="rounded-xl border border-g-200 bg-white p-4">
            <p class="text-[11px] font-medium uppercase tracking-[0.15em] text-g-400">Wishlists</p>
            <p class="mt-2 text-2xl font-bold text-g-950">
              {{ stats?.favorites ?? '—' }}
            </p>
            <p class="mt-1 text-xs text-g-500">Total lignes dans user_favorites.</p>
          </div>
          <div class="rounded-xl border border-g-200 bg-white p-4">
            <p class="text-[11px] font-medium uppercase tracking-[0.15em] text-g-400">Dernière activité</p>
            <p class="mt-2 text-sm font-medium text-g-900">À implémenter</p>
            <p class="mt-1 text-xs text-g-500">Logs et métriques globales.</p>
          </div>
        </div>
      </section>

      <section v-else-if="activeTab === 'users'" class="space-y-4">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-sm font-semibold text-g-900">Utilisateurs</h2>
          <p class="text-xs text-g-500">
            {{ profiles.length }} utilisateur{{ profiles.length > 1 ? 's' : '' }}
          </p>
        </div>

        <div class="overflow-x-auto rounded-xl border border-g-200 bg-white">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-g-50 text-xs font-semibold uppercase tracking-[0.15em] text-g-400">
              <tr>
                <th class="px-4 py-3">Email</th>
                <th class="px-4 py-3">Rôle</th>
                <th class="px-4 py-3 hidden sm:table-cell">Créé le</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in profiles"
                :key="row.id"
                class="border-t border-g-100 hover:bg-g-50/60"
              >
                <td class="max-w-[260px] px-4 py-3 text-sm text-g-900 align-top">
                  <p class="truncate">{{ row.email }}</p>
                  <p class="mt-0.5 text-xs text-g-400">
                    {{ row.id }}
                  </p>
                  <NuxtLink
                    :to="`/profil/${(row as { username?: string }).username ?? row.id}`"
                    class="mt-2 inline-flex items-center gap-1 text-xs font-medium text-g-500 transition-colors hover:text-g-950"
                  >
                    <UIcon name="i-lucide-external-link" class="h-3 w-3" />
                    Voir le profil
                  </NuxtLink>
                </td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize"
                    :class="row.role === 'admin'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-g-100 text-g-700'"
                  >
                    <UIcon
                      :name="row.role === 'admin' ? 'i-lucide-shield-check' : 'i-lucide-user'"
                      class="mr-1.5 h-3.5 w-3.5"
                    />
                    {{ row.role }}
                  </span>
                </td>
                <td class="hidden px-4 py-3 text-xs text-g-500 sm:table-cell">
                  {{ row.created_at ? new Date(row.created_at).toLocaleString('fr-FR') : '—' }}
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    class="inline-flex min-h-[32px] items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors"
                    :class="row.role === 'admin'
                      ? 'border-g-200 text-g-600 hover:border-g-400'
                      : 'border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-500 hover:bg-amber-100'"
                    :disabled="updatingUserIds.has(row.id)"
                    @click="toggleRole(row as any)"
                  >
                    <UIcon
                      :name="row.role === 'admin' ? 'i-lucide-shield-off' : 'i-lucide-shield-check'"
                      class="h-3.5 w-3.5"
                    />
                    <span>
                      {{ row.role === 'admin' ? 'Retirer admin' : 'Promouvoir admin' }}
                    </span>
                  </button>
                </td>
              </tr>
              <tr v-if="!profiles.length">
                <td colspan="4" class="px-4 py-6 text-center text-sm text-g-400">
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-else-if="activeTab === 'collections'" class="space-y-4">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-sm font-semibold text-g-900">Collections</h2>
          <p class="text-xs text-g-500">
            {{ collections.length }} entrée{{ collections.length > 1 ? 's' : '' }} (dernières 200)
          </p>
        </div>

        <div class="overflow-x-auto rounded-xl border border-g-200 bg-white">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-g-50 text-xs font-semibold uppercase tracking-[0.15em] text-g-400">
              <tr>
                <th class="px-4 py-3">Utilisateur</th>
                <th class="px-4 py-3">Vinyle</th>
                <th class="px-4 py-3 hidden sm:table-cell">Détails</th>
                <th class="px-4 py-3 hidden md:table-cell">Ajouté le</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in collections"
                :key="row.id"
                class="border-t border-g-100 hover:bg-g-50/60"
              >
                <td class="max-w-[200px] px-4 py-3 text-xs text-g-500">
                  <p class="truncate text-sm text-g-900">
                    {{ profilesMap.get(row.user_id)?.email || '—' }}
                  </p>
                  <p class="mt-0.5 truncate font-mono text-[11px] text-g-400">
                    {{ row.user_id }}
                  </p>
                </td>
                <td class="max-w-[260px] px-4 py-3">
                  <p class="truncate text-sm font-medium text-g-950">
                    {{ row.title || '—' }}
                  </p>
                  <p class="mt-0.5 truncate text-xs text-g-500">
                    {{ row.artist || '—' }}
                  </p>
                </td>
                <td class="hidden max-w-[220px] px-4 py-3 text-xs text-g-500 sm:table-cell">
                  <p class="truncate">
                    {{ row.label || '—' }} · {{ row.year || '—' }}
                  </p>
                  <p class="mt-0.5 truncate text-[11px] text-g-400">
                    Discogs ID : {{ row.discogs_id }}
                  </p>
                </td>
                <td class="hidden px-4 py-3 text-xs text-g-500 md:table-cell">
                  {{ row.created_at ? new Date(row.created_at).toLocaleString('fr-FR') : '—' }}
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex justify-end gap-2">
                    <button
                      class="inline-flex min-h-[32px] items-center justify-center gap-1.5 rounded-lg border border-g-200 px-2.5 py-1.5 text-xs font-medium text-g-700 transition-colors hover:border-g-900 hover:text-g-900"
                      @click="saveCollectionRow(row as any)"
                    >
                      <UIcon name="i-lucide-save" class="h-3.5 w-3.5" />
                      Sauvegarder
                    </button>
                    <button
                      class="inline-flex min-h-[32px] items-center justify-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-500 transition-colors hover:border-red-400 hover:bg-red-50"
                      @click="deleteCollectionRow(row.id)"
                    >
                      <UIcon name="i-lucide-trash-2" class="h-3.5 w-3.5" />
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!collections.length">
                <td colspan="4" class="px-4 py-6 text-center text-sm text-g-400">
                  Aucune entrée dans les collections.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-else-if="activeTab === 'favorites'" class="space-y-4">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-sm font-semibold text-g-900">Wishlists</h2>
          <p class="text-xs text-g-500">
            {{ favorites.length }} entrée{{ favorites.length > 1 ? 's' : '' }} (dernières 200)
          </p>
        </div>

        <div class="overflow-x-auto rounded-xl border border-g-200 bg-white">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-g-50 text-xs font-semibold uppercase tracking-[0.15em] text-g-400">
              <tr>
                <th class="px-4 py-3">Utilisateur</th>
                <th class="px-4 py-3">Vinyle</th>
                <th class="px-4 py-3 hidden sm:table-cell">Discogs ID</th>
                <th class="px-4 py-3 hidden md:table-cell">Ajouté le</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in favorites"
                :key="row.id"
                class="border-t border-g-100 hover:bg-g-50/60"
              >
                <td class="max-w-[200px] px-4 py-3 text-xs text-g-500">
                  <p class="truncate text-sm text-g-900">
                    {{ profilesMap.get(row.user_id)?.email || '—' }}
                  </p>
                  <p class="mt-0.5 truncate font-mono text-[11px] text-g-400">
                    {{ row.user_id }}
                  </p>
                </td>
                <td class="max-w-[260px] px-4 py-3">
                  <p class="truncate text-sm font-medium text-g-950">
                    {{ row.title || '—' }}
                  </p>
                  <p class="mt-0.5 truncate text-xs text-g-500">
                    {{ row.artist || '—' }}
                  </p>
                </td>
                <td class="hidden px-4 py-3 text-xs text-g-500 sm:table-cell">
                  {{ row.discogs_id }}
                </td>
                <td class="hidden px-4 py-3 text-xs text-g-500 md:table-cell">
                  {{ row.created_at ? new Date(row.created_at).toLocaleString('fr-FR') : '—' }}
                </td>
              </tr>
              <tr v-if="!favorites.length">
                <td colspan="4" class="px-4 py-6 text-center text-sm text-g-400">
                  Aucune entrée dans les wishlists.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>
</template>
