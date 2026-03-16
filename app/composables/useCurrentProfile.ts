import type { Database } from '~/database.types'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

export function useCurrentProfile() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const profile = ref<ProfileRow | null>(null)
  const loading = ref(false)

  const isAdmin = computed(() => profile.value?.role === 'admin')

  async function fetchProfile() {
    if (!user.value) {
      profile.value = null
      return
    }
    loading.value = true
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', (user.value as any).id ?? (user.value as any).sub)
      .maybeSingle()

    if (error) {
      console.error('[groov] fetchProfile error', error)
      loading.value = false
      return
    }
    if (data) profile.value = data
    loading.value = false
  }

  watch(user, () => {
    fetchProfile()
  }, { immediate: true })

  return {
    profile,
    loading,
    isAdmin,
    fetchProfile,
  }
}

