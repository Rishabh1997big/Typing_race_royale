/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

export default defineConfig(({ mode }) => {
  // The single root .env is shared with the API; read API_PORT to target the proxy.
  const env = loadEnv(mode, repoRoot, '')
  const apiOrigin = `http://localhost:${env.API_PORT ?? '3000'}`

  return {
    plugins: [react(), tailwindcss()],
    envDir: repoRoot,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@trr/shared': fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url)),
      },
      // Shared code must use the web app's copy of zod, not a second one.
      dedupe: ['zod'],
    },
    server: {
      port: 5173,
      strictPort: true,
      fs: { allow: [repoRoot] },
      // Same-origin in development: no CORS, and cookies work without extra config.
      proxy: {
        '/api': apiOrigin,
        '/ws': { target: apiOrigin, ws: true },
      },
    },
    test: {
      include: ['tests/**/*.test.{ts,tsx}'],
      environment: 'node',
    },
  }
})
