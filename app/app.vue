<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const { showLogin, showRegister, closeAll, switchToRegister, switchToLogin } = useAuthModal()
const toast = useToast()
const supabase = useSupabaseClient()

// ── Login ──
const loginSchema = z.object({
  email: z.email('Email invalide'),
  password: z.string('Le mot de passe est requis'),
})

type LoginSchema = z.output<typeof loginSchema>

const loginState = reactive({ email: '', password: '' })

async function onLogin(payload: FormSubmitEvent<LoginSchema>) {
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
    closeAll()
    await navigateTo('/')
  }
}

// ── Register ──
const registerSchema = z
  .object({
    email: z.email('Email invalide'),
    password: z.string('Le mot de passe est requis').min(8, 'Au moins 8 caractères'),
    confirmPassword: z.string('Confirmation requise'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

type RegisterSchema = z.output<typeof registerSchema>

const registerState = reactive({ email: '', password: '', confirmPassword: '' })

async function onRegister(payload: FormSubmitEvent<RegisterSchema>) {
  const { data, error } = await supabase.auth.signUp({
    email: payload.data.email,
    password: payload.data.password,
  })

  if (error) {
    toast.add({ title: "Erreur d'inscription", description: error.message, color: 'error' })
    return
  }

  if (data.user) {
    toast.add({ title: 'Compte créé', description: 'Vous pouvez maintenant vous connecter.', color: 'success' })
    switchToLogin()
  }
}
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtPage />

    <!-- ── Modal Login ── -->
    <UModal v-model:open="showLogin" :ui="{ content: 'max-w-md' }">
      <template #content>
        <div class="rounded-lg bg-g-950 p-8">
          <h2 class="text-xl font-bold text-g-white">Connexion</h2>
          <p class="mt-1 text-sm text-g-400">
            Vous n'avez pas de compte ?
            <button class="cursor-pointer font-medium text-g-white underline underline-offset-4" @click="switchToRegister">
              Créer un compte
            </button>
          </p>

          <UForm :schema="loginSchema" :state="loginState" class="mt-6 space-y-4" @submit="onLogin">
            <UFormField label="Email" name="email">
              <template #label>
                <span class="text-sm text-g-300">Email</span>
              </template>
              <UInput
                v-model="loginState.email"
                type="email"
                placeholder="email@exemple.com"
                size="lg"
                :ui="{ root: 'w-full' }"
                class="[&_input]:rounded-lg [&_input]:border-g-500 [&_input]:bg-g-700 [&_input]:text-g-white [&_input]:placeholder-g-400 [&_input]:focus:border-g-300 [&_input]:focus:bg-g-600 [&_input]:focus:outline-none [&_input]:focus:ring-0"
              />
            </UFormField>

            <UFormField label="Mot de passe" name="password">
              <template #label>
                <span class="text-sm text-g-300">Mot de passe</span>
              </template>
              <UInput
                v-model="loginState.password"
                type="password"
                placeholder="••••••••"
                size="lg"
                :ui="{ root: 'w-full' }"
                class="[&_input]:rounded-lg [&_input]:border-g-500 [&_input]:bg-g-700 [&_input]:text-g-white [&_input]:placeholder-g-400 [&_input]:focus:border-g-300 [&_input]:focus:bg-g-600 [&_input]:focus:outline-none [&_input]:focus:ring-0"
              />
            </UFormField>

            <UButton type="submit" block size="lg" class="mt-2 cursor-pointer rounded-lg bg-g-white font-medium text-g-black hover:bg-g-200">
              Se connecter
            </UButton>
          </UForm>
        </div>
      </template>
    </UModal>

    <!-- ── Modal Register ── -->
    <UModal v-model:open="showRegister" :ui="{ content: 'max-w-md' }">
      <template #content>
        <div class="rounded-lg bg-g-950 p-8">
          <h2 class="text-xl font-bold text-g-white">Créer un compte</h2>
          <p class="mt-1 text-sm text-g-400">
            Vous avez déjà un compte ?
            <button class="cursor-pointer font-medium text-g-white underline underline-offset-4" @click="switchToLogin">
              Se connecter
            </button>
          </p>

          <UForm :schema="registerSchema" :state="registerState" class="mt-6 space-y-4" @submit="onRegister">
            <UFormField label="Email" name="email">
              <template #label>
                <span class="text-sm text-g-300">Email</span>
              </template>
              <UInput
                v-model="registerState.email"
                type="email"
                placeholder="email@exemple.com"
                size="lg"
                :ui="{ root: 'w-full' }"
                class="[&_input]:rounded-lg [&_input]:border-g-500 [&_input]:bg-g-700 [&_input]:text-g-white [&_input]:placeholder-g-400 [&_input]:focus:border-g-300 [&_input]:focus:bg-g-600 [&_input]:focus:outline-none [&_input]:focus:ring-0"
              />
            </UFormField>

            <UFormField label="Mot de passe" name="password">
              <template #label>
                <span class="text-sm text-g-300">Mot de passe</span>
              </template>
              <UInput
                v-model="registerState.password"
                type="password"
                placeholder="••••••••"
                size="lg"
                :ui="{ root: 'w-full' }"
                class="[&_input]:rounded-lg [&_input]:border-g-500 [&_input]:bg-g-700 [&_input]:text-g-white [&_input]:placeholder-g-400 [&_input]:focus:border-g-300 [&_input]:focus:bg-g-600 [&_input]:focus:outline-none [&_input]:focus:ring-0"
              />
            </UFormField>

            <UFormField label="Confirmer le mot de passe" name="confirmPassword">
              <template #label>
                <span class="text-sm text-g-300">Confirmer le mot de passe</span>
              </template>
              <UInput
                v-model="registerState.confirmPassword"
                type="password"
                placeholder="••••••••"
                size="lg"
                :ui="{ root: 'w-full' }"
                class="[&_input]:rounded-lg [&_input]:border-g-500 [&_input]:bg-g-700 [&_input]:text-g-white [&_input]:placeholder-g-400 [&_input]:focus:border-g-300 [&_input]:focus:bg-g-600 [&_input]:focus:outline-none [&_input]:focus:ring-0"
              />
            </UFormField>

            <UButton type="submit" block size="lg" class="mt-2 cursor-pointer rounded-lg bg-g-white font-medium text-g-black hover:bg-g-200">
              Créer un compte
            </UButton>
          </UForm>
        </div>
      </template>
    </UModal>
  </UApp>
</template>
