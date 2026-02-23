<script setup lang="ts">
import * as z from "zod"
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui"

const toast = useToast()

const fields: AuthFormField[] = [
  {
    name: "email",
    type: "email",
    label: "Email",
    placeholder: "Entrez votre email",
    required: true,
  },
  {
    name: "password",
    label: "Mot de passe",
    type: "password",
    required: true,
  },
  {
    name: "confirmPassword",
    label: "Confirmer le mot de passe",
    type: "password",
    required: true,
  },
]

const schema = z
  .object({
    email: z.email("Email invalide"),
    password: z
      .string("Le mot de passe est requis")
      .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string("La confirmation du mot de passe est requise"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  })

type Schema = z.output<typeof schema>

const supabase = useSupabaseClient()

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  const { data, error } = await supabase.auth.signUp({
    email: payload.data.email,
    password: payload.data.password,
  })

  if (error) {
    toast.add({
      title: "Erreur d'inscription",
      description: error.message,
      color: "error",
    })
    return
  }

  if (data.user) {
    toast.add({
      title: "Compte créé",
      description: "Vous pouvez maintenant vous connecter.",
      color: "green",
    })
    await navigateTo("/auth/login")
  }
}
</script>

<template>
  <div class="h-screen flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        title="Créer un compte"
        description="Inscrivez-vous pour utiliser Groove."
        icon="i-lucide-user-plus"
        :fields="fields"
        :submit="{ label: 'Créer un compte' }"
        @submit="onSubmit"
      >
        <template #description>
          Vous avez déjà un compte ?
          <ULink to="/auth/login" class="text-primary font-medium">
            Se connecter
          </ULink>
          .
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>

