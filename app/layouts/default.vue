<template>
  <div class="flex min-h-screen flex-col overflow-x-hidden pb-[env(safe-area-inset-bottom,0px)]">
    <AppHeader />
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
