import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
