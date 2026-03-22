import path from 'path';
import checker from 'vite-plugin-checker';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// ----------------------------------------------------------------------

const PORT = 3039;

export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: true,
      eslint: {
        useFlatConfig: true,
        lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
        dev: { logLevel: ['error'] },
      },
      overlay: {
        position: 'tl',
        initialIsOpen: false,
      },
    }),
  ],
  resolve: {
    alias: [
      {
        find: 'src',
        replacement: path.resolve(__dirname, 'src'),
      },
    ],
  },

  server: {
    port: PORT,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://api:8000',
        changeOrigin: true,
      },
      '/images': {
        target: 'http://api:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: PORT,
    host: true,
    allowedHosts: true,
  },
});