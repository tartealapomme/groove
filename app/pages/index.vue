<script lang="ts" setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const { data, pending } = useAsyncData("profile", async () => {
  if (!user.value) return null
  // Exemple de requête simple, à adapter à ton modèle
  const { data, error } = await supabase.from("profiles").select("*").limit(1)
  if (error) {
    console.error(error)
    return null
  }
  return data?.[0] ?? null
})
</script>

<template>
  <UContainer class="py-10 space-y-6">
    <UPageHeader
      title="Groove"
      description="Squelette Nuxt + Supabase prêt à être adapté à ton projet."
    />

    <div class="space-y-4">
      <div v-if="!user">
        <UAlert
          title="Vous n'êtes pas connecté"
          description="Allez sur /auth/login pour vous connecter via Supabase."
          icon="i-lucide-user"
          color="amber"
        />
      </div>
      <div v-else>
        <UAlert
          title="Vous êtes connecté"
          :description="`Email : ${user.email}`"
          icon="i-lucide-badge-check"
          color="green"
        />

        <div>
          <p class="font-semibold mb-2">Données d'exemple (table profiles) :</p>
          <div v-if="pending">Chargement...</div>
          <pre v-else class="text-xs bg-white p-3 rounded border overflow-auto">
{{ data }}
          </pre>
        </div>
      </div>
    </div>
  </UContainer>
</template>

