const showLogin = ref(false)
const showRegister = ref(false)

export function useAuthModal() {
  function openLogin() {
    showRegister.value = false
    showLogin.value = true
  }

  function openRegister() {
    showLogin.value = false
    showRegister.value = true
  }

  function closeAll() {
    showLogin.value = false
    showRegister.value = false
  }

  function switchToRegister() {
    showLogin.value = false
    showRegister.value = true
  }

  function switchToLogin() {
    showRegister.value = false
    showLogin.value = true
  }

  return {
    showLogin,
    showRegister,
    openLogin,
    openRegister,
    closeAll,
    switchToRegister,
    switchToLogin,
  }
}
