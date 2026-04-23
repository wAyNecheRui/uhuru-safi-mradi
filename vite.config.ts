import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      injectRegister: false,
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false // Disable PWA in development for faster HMR
      },
      includeAssets: ['favicon.ico', 'favicon-16.png', 'favicon-32.png', 'apple-touch-icon.png', 'robots.txt'],
      manifest: {
        name: 'Uhuru Safi',
        short_name: 'Uhuru Safi',
        description: 'Kenya\'s Official Government Project Transparency Platform',
        theme_color: '#1e3a5f',
        background_color: '#1e3a5f',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any'
          }
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Ensure a single React instance — prevents "Invalid hook call" when
    // libraries (i18next-browser-languagedetector, react-i18next, etc.)
    // accidentally trigger a duplicate React resolution.
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // Pre-bundle i18n libs so they share React with the app bundle and
    // don't trigger a mid-render Vite re-optimization (which can serve a
    // null React module to in-flight components).
    include: ['react', 'react-dom', 'i18next', 'react-i18next', 'i18next-browser-languagedetector'],
  },
  build: {
    // Raise warning threshold; we deliberately split heavy libs below
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Manual chunking improves cache-hit rates on Kenyan mobile networks
        // by isolating rarely-changing heavy vendor code from app code.
        manualChunks: {
          // Mapping libraries (heavy, only used on map views)
          'vendor-maps': ['maplibre-gl', 'leaflet', 'react-leaflet'],
          // PDF + canvas rendering (used only for LPO/report generation)
          'vendor-pdf': ['jspdf'],
          // Charting (used only on analytics dashboards)
          'vendor-charts': ['recharts'],
          // Radix UI primitives (shared across many pages, cache once)
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-toast',
          ],
          // Supabase client + react-query
          'vendor-data': ['@supabase/supabase-js', '@tanstack/react-query'],
          // Form & validation libraries
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
  },
}));
