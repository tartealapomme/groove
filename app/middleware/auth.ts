export default defineNuxtRouteMiddleware(() => {
  const user = useSupabaseUser()
  if (!user.value) {
    return navigateTo('/auth/login', { query: { redirect: useRoute().fullPath } })
  }
})
