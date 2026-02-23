// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/eslint", "@nuxt/ui", "@nuxtjs/supabase"],
  css: ["~/assets/css/main.css"],

  ui: {
    colorMode: false,
  },

  supabase: {
    // On pourra générer un database.types.ts plus tard
    types: "~~/database.types.ts",
    redirectOptions: {
      login: "/auth/login",
      callback: "/",
      include: undefined,
      exclude: ["/auth/register"],
    },
  },
})

