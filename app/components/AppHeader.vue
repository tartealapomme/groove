<script lang="ts" setup>
import logoBlanc from '~/assets/img/groov_logo_blanc.svg'

const { openLogin, openRegister } = useAuthModal()
const user = useSupabaseUser()
const supabase = useSupabaseClient()

const showUserMenu = ref(false)
const showAuthMenu = ref(false)
const menuRef = ref<HTMLElement | null>(null)
const authMenuRef = ref<HTMLElement | null>(null)

const userInitials = computed(() => {
  if (!user.value?.email) return '?'
  return user.value.email.substring(0, 2).toUpperCase()
})

async function logout() {
  await supabase.auth.signOut()
  showUserMenu.value = false
  navigateTo('/')
}

function onClickOutside(e: MouseEvent) {
  const target = e.target as Node
  if (menuRef.value && !menuRef.value.contains(target)) {
    showUserMenu.value = false
  }
  if (authMenuRef.value && !authMenuRef.value.contains(target)) {
    showAuthMenu.value = false
  }
}

function handleOpenLogin() {
  showAuthMenu.value = false
  openLogin()
}

function handleOpenRegister() {
  showAuthMenu.value = false
  openRegister()
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <nav class="sticky inset-x-0 top-0 z-50 bg-g-black pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
    <div class="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:h-24 sm:px-6">
      <NuxtLink to="/" class="flex shrink-0 cursor-pointer items-center">
        <img :src="logoBlanc" alt="GROOV" class="h-7 sm:h-9">
      </NuxtLink>

      <div class="mx-4 hidden max-w-xl flex-1 md:mx-8 md:block">
        <SearchBar />
      </div>

      <!-- Logged out -->
      <div v-if="!user" ref="authMenuRef" class="relative">
        <!-- Mobile : icône Compte qui ouvre un menu (comme les sites e-commerce) -->
        <button
          class="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg border border-g-600 text-g-300 transition-colors hover:border-g-500 hover:bg-g-800 hover:text-g-white sm:hidden"
          aria-label="Compte"
          title="Compte"
          @click.stop="showAuthMenu = !showAuthMenu"
        >
          <UIcon name="i-lucide-user" class="h-5 w-5" />
        </button>

        <!-- Desktop : Connexion + S'inscrire visibles -->
        <div class="hidden items-center gap-7 sm:flex">
          <button
            class="cursor-pointer text-[15px] text-g-400 transition-colors hover:text-g-white"
            @click="openLogin"
          >
            Connexion
          </button>
          <UButton
            size="md"
            class="cursor-pointer rounded-lg bg-g-white px-5 text-[15px] font-medium text-g-black hover:bg-g-200"
            @click="openRegister"
          >
            S'inscrire
          </UButton>
        </div>

        <!-- Dropdown auth (mobile) -->
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="scale-95 opacity-0"
          enter-to-class="scale-100 opacity-100"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="showAuthMenu"
            class="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-g-700 bg-g-900 shadow-xl sm:hidden"
          >
            <div class="py-1">
              <button
                class="flex min-h-[44px] w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm text-g-300 transition-colors hover:bg-g-800 hover:text-g-white"
                @click="handleOpenLogin"
              >
                <UIcon name="i-lucide-log-in" class="h-4 w-4 shrink-0 text-g-500" />
                Connexion
              </button>
              <button
                class="flex min-h-[44px] w-full cursor-pointer items-center gap-3 border-t border-g-700 px-4 py-3 text-left text-sm font-medium text-g-white transition-colors hover:bg-g-800"
                @click="handleOpenRegister"
              >
                <UIcon name="i-lucide-user-plus" class="h-4 w-4 shrink-0 text-g-500" />
                S'inscrire
              </button>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Logged in -->
      <div v-else ref="menuRef" class="relative flex items-center gap-2 sm:gap-5">
        <NuxtLink
          to="/bibliotheque"
          class="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center text-g-400 transition-colors hover:text-g-white"
          title="Ma bibliothèque"
        >
          <UIcon name="i-lucide-library-big" class="h-5 w-5" />
        </NuxtLink>

        <button
          class="flex h-10 w-10 min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-full border border-g-600 bg-g-700 text-xs font-bold text-g-white transition-colors hover:border-g-400 hover:bg-g-600 sm:h-9 sm:w-9 sm:min-h-0 sm:min-w-0"
          @click.stop="showUserMenu = !showUserMenu"
        >
          {{ userInitials }}
        </button>

        <!-- Dropdown menu -->
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="scale-95 opacity-0"
          enter-to-class="scale-100 opacity-100"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="showUserMenu"
            class="absolute right-0 top-full z-50 mt-2 w-56 min-w-[200px] overflow-hidden rounded-lg border border-g-700 bg-g-900 shadow-xl"
          >
            <div class="border-b border-g-700 px-4 py-3">
              <p class="truncate text-sm font-medium text-g-white">{{ user.email }}</p>
              <p class="mt-0.5 text-[11px] text-g-500">Compte GROOV</p>
            </div>

            <div class="py-1">
              <NuxtLink
                to="/bibliotheque"
                class="flex min-h-[44px] cursor-pointer items-center gap-3 px-4 py-3 text-sm text-g-300 transition-colors hover:bg-g-800 hover:text-g-white sm:py-2.5"
                @click="showUserMenu = false"
              >
                <UIcon name="i-lucide-library-big" class="h-4 w-4 shrink-0 text-g-500" />
                Ma bibliothèque
              </NuxtLink>
              <NuxtLink
                to="/explore"
                class="flex min-h-[44px] cursor-pointer items-center gap-3 px-4 py-3 text-sm text-g-300 transition-colors hover:bg-g-800 hover:text-g-white sm:py-2.5"
                @click="showUserMenu = false"
              >
                <UIcon name="i-lucide-compass" class="h-4 w-4 shrink-0 text-g-500" />
                Explorer
              </NuxtLink>
            </div>

            <div class="border-t border-g-700 py-1">
              <button
                class="flex min-h-[44px] w-full cursor-pointer items-center gap-3 px-4 py-3 text-sm text-g-400 transition-colors hover:bg-g-800 hover:text-red-400 sm:py-2.5"
                @click="logout"
              >
                <UIcon name="i-lucide-log-out" class="h-4 w-4 shrink-0" />
                Déconnexion
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </nav>
</template>
