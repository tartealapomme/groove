<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import logoNoir from '~/assets/img/groov_logo_noir.svg'

const toast = useToast()

const fields: AuthFormField[] = [
  { name: 'email', type: 'email', label: 'Email', required: true },
  { name: 'password', label: 'Mot de passe', type: 'password', required: true },
]

const schema = z.object({
  email: z.email('Email invalide'),
  password: z.string('Le mot de passe est requis'),
})

type Schema = z.output<typeof schema>

const supabase = useSupabaseClient()

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.data.email,
    password: payload.data.password,
  })

  if (error) {
    toast.add({ title: 'Erreur de connexion', description: error.message, color: 'error' })
    return
  }

  if (data.session) {
    toast.add({ title: 'Connecté', description: 'Connexion réussie.', color: 'success' })
    await navigateTo('/')
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-g-white px-4">
    <NuxtLink to="/" class="mb-8 cursor-pointer">
      <img :src="logoNoir" alt="GROOV" class="h-7">
    </NuxtLink>

    <div class="w-full max-w-sm">
      <UAuthForm
        :schema="schema"
        title="Connexion"
        description="Connectez-vous à GROOV."
        icon="i-lucide-user"
        :fields="fields"
        :submit="{ label: 'Se connecter', color: 'neutral' }"
        @submit="onSubmit"
      >
        <template #description>
          Vous n'avez pas de compte ?
          <NuxtLink to="/auth/register" class="cursor-pointer font-medium text-g-950 underline underline-offset-4">
            Créer un compte
          </NuxtLink>
        </template>
      </UAuthForm>
    </div>
  </div>
</template>
