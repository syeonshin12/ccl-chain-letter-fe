// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  modules: ["@nuxtjs/google-fonts"],
  css: ["~/assets/css/tailwind.css", "intro.js/introjs.css"],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  googleFonts: {
    families: {
      "Gowun+Dodum": true,
    },
    display: "swap",
    prefetch: true,
    preconnect: true,
  },

  build: {
    transpile: ["three"],
  },
  app: {
    head: {
      title: "행운의 편지",
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },
  },
});
