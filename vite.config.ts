import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  // Allow VITE_BASE_PATH to be set via CI env (e.g. /The-Boxing-Club/ for GitHub Pages)
  base: process.env.VITE_BASE_PATH ?? '/',
})
