<script setup lang="ts">
const { openLogin } = useAuthModal()
const route = useRoute()

definePageMeta({ layout: 'blank' })

onMounted(() => {
  const redirect = route.query.redirect as string | undefined
  openLogin()
  navigateTo({ path: '/', query: redirect ? { redirect } : undefined })
})
</script>

<template>
  <div />
</template>
