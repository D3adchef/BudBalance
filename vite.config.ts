import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig(({ mode }) => {
  const isNative = mode === "native"
  const isWeb = !isNative

  // ✅ CRITICAL FIX:
  // Native apps MUST use relative paths
  // Web (GitHub Pages) uses /BudBalance/
  const base = isNative ? "./" : "/BudBalance/"

  return {
    base,

    plugins: [
      react(),

      // ✅ ONLY enable PWA for web (NOT Capacitor)
      ...(isWeb
        ? [
            VitePWA({
              registerType: "autoUpdate",
              includeAssets: ["favicon.svg"],

              manifest: {
                name: "BudBalance",
                short_name: "BudBalance",
                description:
                  "Cannabis allotment tracking and purchase planner",
                theme_color: "#020617",
                background_color: "#020617",
                display: "standalone",
                orientation: "portrait",

                // ✅ Web only
                start_url: "/BudBalance/",

                icons: [
                  {
                    src: "/BudBalance/pwa-192.png",
                    sizes: "192x192",
                    type: "image/png",
                  },
                  {
                    src: "/BudBalance/pwa-512.png",
                    sizes: "512x512",
                    type: "image/png",
                  },
                ],
              },

              workbox: {
                maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
              },
            }),
          ]
        : []),
    ],
  }
})