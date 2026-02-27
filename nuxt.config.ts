// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/eslint", "@nuxt/ui", "@nuxtjs/supabase"],
  css: ["~/assets/css/main.css"],

  app: {
    pageTransition: { name: "page", mode: "out-in" },
    head: {
      link: [
        { rel: "icon", type: "image/png", href: "/favicon.png" },
      ],
    },
  },


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
      exclude: ["/auth/register", "/vinyl/*", "/explore", "/bibliotheque"],
    },
  },
})

