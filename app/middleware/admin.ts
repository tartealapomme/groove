import type { Database } from '~/database.types'

export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()

  // Pas connecté → retour à l’accueil
  if (!user.value) {
    return navigateTo('/')
  }

  const supabase = useSupabaseClient<Database>()
  const raw = user.value as any
  const userId = raw?.id ?? raw?.sub ?? null

  if (!userId) {
    return navigateTo('/')
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  // En cas d’erreur ou si pas de profil/role admin → pas d’accès
  if (error || !data || data.role !== 'admin') {
    return navigateTo('/')
  }
})


