<script lang="ts" setup>
import logoBlanc from '~/assets/img/groov_logo_blanc.svg'
</script>

<template>
  <footer class="bg-g-black">
    <div class="border-b border-g-700 px-6 py-8">
      <div class="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 sm:flex-row">
        <img :src="logoBlanc" alt="GROOV" class="h-5 opacity-40">
        <div class="flex gap-6">
          <NuxtLink to="#" class="cursor-pointer text-xs text-g-500 transition-colors hover:text-g-white">À propos</NuxtLink>
          <NuxtLink to="#" class="cursor-pointer text-xs text-g-500 transition-colors hover:text-g-white">Contact</NuxtLink>
          <NuxtLink to="#" class="cursor-pointer text-xs text-g-500 transition-colors hover:text-g-white">CGU</NuxtLink>
        </div>
        <p class="text-[11px] text-g-500">Discogs API · Supabase · Vercel · © 2026</p>
      </div>
    </div>
    <div class="px-6 py-4">
      <p class="text-center text-[11px] text-g-600">
        Créé par Timéo Soête, Ulysse Detrait & Nathan Duplouy
      </p>
    </div>
  </footer>
</template>
