<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import logoBlanc from '~/assets/img/groov_logo_blanc.svg'

const { showLogin, showRegister, closeAll, switchToRegister, switchToLogin } = useAuthModal()
const { start: startOnboarding } = useOnboarding()
const toast = useToast()
const supabase = useSupabaseClient()

const isLoginLoading = ref(false)
const isRegisterLoading = ref(false)

function translateAuthError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) return 'Email ou mot de passe incorrect.'
  if (lower.includes('email not confirmed')) return 'Veuillez confirmer votre email en cliquant sur le lien reçu.'
  if (lower.includes('user already registered')) return 'Un compte existe déjà avec cet email.'
  if (lower.includes('password')) return 'Le mot de passe doit contenir au moins 8 caractères.'
  return message
}

// ── Login ──
const loginSchema = z.object({
  email: z.email('Email invalide'),
  password: z.string('Le mot de passe est requis'),
})

type LoginSchema = z.output<typeof loginSchema>

const loginState = reactive({ email: '', password: '' })

async function onLogin(payload: FormSubmitEvent<LoginSchema>) {
  isLoginLoading.value = true
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.data.email,
      password: payload.data.password,
    })

    if (error) {
      toast.add({ title: 'Erreur de connexion', description: translateAuthError(error.message), color: 'error' })
      return
    }

    if (data.session) {
      toast.add({ title: 'Bienvenue !', description: 'Vous êtes connecté.', color: 'success' })
      closeAll()
      await navigateTo('/')
    }
  }
  finally {
    isLoginLoading.value = false
  }
}

async function onForgotPassword() {
  const email = loginState.email
  if (!email) {
    toast.add({ title: 'Email requis', description: 'Entrez votre email pour réinitialiser le mot de passe.', color: 'error' })
    return
  }
  isLoginLoading.value = true
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/` })
    if (error) {
      toast.add({ title: 'Erreur', description: translateAuthError(error.message), color: 'error' })
      return
    }
    toast.add({ title: 'Email envoyé', description: 'Consultez votre boîte mail pour réinitialiser votre mot de passe.', color: 'success' })
  }
  finally {
    isLoginLoading.value = false
  }
}

// ── Register ──
const registerSchema = z
  .object({
    email: z.email('Email invalide'),
    password: z.string('Le mot de passe est requis').min(8, 'Au moins 8 caractères'),
    confirmPassword: z.string('Confirmation requise'),
    acceptTerms: z.boolean().refine(v => v === true, 'Vous devez accepter les conditions d\'utilisation'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

type RegisterSchema = z.output<typeof registerSchema>

const registerState = reactive({ email: '', password: '', confirmPassword: '', acceptTerms: false })

async function onRegister(payload: FormSubmitEvent<RegisterSchema>) {
  isRegisterLoading.value = true
  try {
    const { data, error } = await supabase.auth.signUp({
      email: payload.data.email,
      password: payload.data.password,
    })

    if (error) {
      toast.add({ title: "Erreur d'inscription", description: translateAuthError(error.message), color: 'error' })
      return
    }

    if (data.user) {
      if (data.user.identities?.length === 0) {
        toast.add({ title: 'Compte existant', description: 'Un compte existe déjà avec cet email. Connectez-vous.', color: 'error' })
        switchToLogin()
        return
      }
      toast.add({
        title: 'Compte créé !',
        description: 'Composez votre profil pour commencer.',
        color: 'success',
      })
      closeAll()
      startOnboarding()
    }
  }
  finally {
    isRegisterLoading.value = false
  }
}

watch([showLogin, showRegister], () => {
  if (!showLogin.value && !showRegister.value) {
    loginState.email = ''
    loginState.password = ''
    registerState.email = ''
    registerState.password = ''
    registerState.confirmPassword = ''
    registerState.acceptTerms = false
  }
})
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator color="#fff" :height="2" :throttle="200" />
    <NuxtRouteAnnouncer />
    <NuxtPage />
    <OnboardingOverlay />

    <!-- ── Modal Login ── -->
    <UModal v-model:open="showLogin" :ui="{ content: 'max-w-md overflow-hidden rounded-lg border-0 ring-0 bg-transparent shadow-2xl', overlay: 'bg-g-black/70 backdrop-blur-sm' }">
      <template #content>
        <div class="relative bg-g-950 p-8">
          <div class="absolute inset-0 bg-gradient-to-b from-g-800/30 to-transparent pointer-events-none" />
          <div class="relative">
            <div class="mb-6 flex items-center justify-between">
              <img :src="logoBlanc" alt="GROOV" class="h-6 opacity-90">
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                size="sm"
                class="cursor-pointer -mr-2 text-g-400 hover:bg-g-700 hover:text-g-white"
                aria-label="Fermer"
                @click="closeAll"
              />
            </div>

            <h2 class="text-xl font-bold text-g-white">Connexion</h2>
            <p class="mt-1 text-sm text-g-400">
              Vous n'avez pas de compte ?
              <UButton variant="link" class="cursor-pointer p-0 text-g-white underline underline-offset-4" @click="switchToRegister">
                Créer un compte
              </UButton>
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

              <UButton
                variant="link"
                size="sm"
                class="cursor-pointer -mt-2 p-0 text-xs text-g-400 hover:text-g-white"
                @click="onForgotPassword"
              >
                Mot de passe oublié ?
              </UButton>

              <USeparator class="my-4 border-g-700" />

              <UButton
                type="submit"
                block
                size="lg"
                class="cursor-pointer rounded-lg bg-g-white font-medium text-g-black hover:bg-g-200 disabled:opacity-50"
                :loading="isLoginLoading"
                :disabled="isLoginLoading"
              >
                Se connecter
              </UButton>
            </UForm>
          </div>
        </div>
      </template>
    </UModal>

    <!-- ── Modal Register ── -->
    <UModal v-model:open="showRegister" :ui="{ content: 'max-w-md overflow-hidden rounded-lg border-0 ring-0 bg-transparent shadow-2xl', overlay: 'bg-g-black/70 backdrop-blur-sm' }">
      <template #content>
        <div class="relative bg-g-950 p-8">
          <div class="absolute inset-0 bg-gradient-to-b from-g-800/30 to-transparent pointer-events-none" />
          <div class="relative">
            <div class="mb-6 flex items-center justify-between">
              <img :src="logoBlanc" alt="GROOV" class="h-6 opacity-90">
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                size="sm"
                class="cursor-pointer -mr-2 text-g-400 hover:bg-g-700 hover:text-g-white"
                aria-label="Fermer"
                @click="closeAll"
              />
            </div>

            <h2 class="text-xl font-bold text-g-white">Créer un compte</h2>
            <p class="mt-1 text-sm text-g-400">
              Vous avez déjà un compte ?
              <UButton variant="link" class="cursor-pointer p-0 text-g-white underline underline-offset-4" @click="switchToLogin">
                Se connecter
              </UButton>
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

              <UFormField name="acceptTerms">
                <div class="flex items-start gap-3">
                  <UCheckbox
                    v-model="registerState.acceptTerms"
                    :ui="{ root: 'mt-0.5', base: 'rounded border-g-500 bg-g-700 data-[state=checked]:bg-g-white data-[state=checked]:border-g-700' }"
                  />
                  <label class="cursor-pointer text-sm text-g-400">
                    J'accepte les
                    <NuxtLink to="#" class="text-g-white underline underline-offset-2 hover:text-g-200">conditions d'utilisation</NuxtLink>
                    et la
                    <NuxtLink to="#" class="text-g-white underline underline-offset-2 hover:text-g-200">politique de confidentialité</NuxtLink>
                    de GROOV.
                  </label>
                </div>
              </UFormField>

              <USeparator class="my-4 border-g-700" />

              <UButton
                type="submit"
                block
                size="lg"
                class="cursor-pointer rounded-lg bg-g-white font-medium text-g-black hover:bg-g-200 disabled:opacity-50"
                :loading="isRegisterLoading"
                :disabled="isRegisterLoading"
              >
                Créer un compte
              </UButton>
            </UForm>
          </div>
        </div>
      </template>
    </UModal>
  </UApp>
</template>
