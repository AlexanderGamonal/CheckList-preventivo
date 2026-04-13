import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}', 'icons/*.png', 'favicon-32.png'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/auth/],
        runtimeCaching: [
          {
            // Supabase API — siempre red, datos en tiempo real
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
      manifest: {
        name: 'CheckList Mantenimiento ATM',
        short_name: 'CheckList ATM',
        description: 'Sistema de checklist de mantenimiento preventivo de cajeros automáticos.',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'es',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — siempre necesario
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // Charts — solo se carga en DashboardPage
          'vendor-charts': ['recharts'],

          // Excel import — solo se carga en AtmsPage / TecnicosPage
          'vendor-xlsx': ['xlsx'],
        },
      },
    },
    // Avisa si algún chunk supera 500 KB
    chunkSizeWarningLimit: 500,
  },
});
