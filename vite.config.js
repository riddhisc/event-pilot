import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.svg', 'hero-image.png'],
      manifest: {
        name: 'Event Pilot',
        short_name: 'Event Pilot',
        description: 'Plan. Track. Connect. Make every company event effortless.',
        theme_color: '#4F46E5',
        background_color: '#F7F7F8',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/logo.svg', sizes: 'any', purpose: 'any' },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5175,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
});
